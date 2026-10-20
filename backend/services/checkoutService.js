const Cart = require('../models/Cart');
const { getSql } = require('../config/db');
const { httpError } = require('../middleware/errorHandler');

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

async function checkout(userId) {
  const cart = await Cart.findOne({ user_id: userId });
  if (!cart || !cart.items.length) {
    throw httpError(400, 'Your cart is empty.');
  }

  const sql = getSql();
  let orderId;
  let totalAmount = 0;
  const snapshotItems = [];

  try {
    const result = await sql.withTransaction(async (tx) => {
      let runningTotal = 0;
      const lines = [];

      for (const item of cart.items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
          throw httpError(400, 'Each cart quantity must be a positive whole number.');
        }

        const lockSql =
          sql.kind === 'mysql'
            ? 'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE'
            : 'SELECT id, name, price, stock FROM products WHERE id = ?';

        const rows = await tx.query(lockSql, [item.product_id]);
        const product = rows[0];
        if (!product) {
          throw httpError(400, `Product ${item.product_id} is no longer available.`);
        }
        if (Number(product.stock) < quantity) {
          throw httpError(
            409,
            `Not enough stock for "${product.name}". Available: ${product.stock}.`
          );
        }

        const price = toMoney(product.price);
        runningTotal = toMoney(runningTotal + price * quantity);
        lines.push({
          product_id: Number(product.id),
          name: product.name,
          quantity,
          price_at_purchase: price
        });
      }

      const orderInsert = await tx.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, runningTotal, 'Placed']
      );
      const newOrderId = orderInsert.insertId;

      for (const line of lines) {
        await tx.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES (?, ?, ?, ?)`,
          [newOrderId, line.product_id, line.quantity, line.price_at_purchase]
        );

        const stockUpdate = await tx.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [line.quantity, line.product_id, line.quantity]
        );
        if (!stockUpdate.affectedRows) {
          throw httpError(409, `Could not reserve stock for product ${line.product_id}.`);
        }
      }

      return { orderId: newOrderId, totalAmount: runningTotal, items: lines };
    });

    orderId = result.orderId;
    totalAmount = result.totalAmount;
    snapshotItems.push(...result.items);
  } catch (err) {
    // SQL rollback already happened inside withTransaction.
    throw err;
  }

  try {
    cart.items = [];
    cart.updated_at = new Date();
    await cart.save();
  } catch (mongoErr) {
    console.error('SQL order committed but MongoDB cart was not cleared:', mongoErr);
    return {
      orderId,
      totalAmount,
      items: snapshotItems,
      warning:
        'Order was saved, but the cart could not be cleared. Refresh your orders. Do not check out again until the cart is empty.'
    };
  }

  return { orderId, totalAmount, items: snapshotItems };
}

module.exports = { checkout };
