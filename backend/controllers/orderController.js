const { getSql } = require('../config/db');
const { checkout } = require('../services/checkoutService');
const { httpError } = require('../middleware/errorHandler');

const ALLOWED_STATUS = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function toOrder(row) {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    total_amount: Number(row.total_amount),
    status: row.status,
    created_at: row.created_at
  };
}

async function attachItems(orders) {
  if (!orders.length) return [];
  const sql = getSql();
  const ids = orders.map((o) => o.id);
  const placeholders = ids.map(() => '?').join(',');
  const rows = await sql.query(
    `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${placeholders})`,
    ids
  );
  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(Number(row.order_id)) || [];
    list.push({
      product_id: Number(row.product_id),
      name: row.name,
      image_url: row.image_url,
      quantity: Number(row.quantity),
      price_at_purchase: Number(row.price_at_purchase),
      line_total: Number((Number(row.price_at_purchase) * Number(row.quantity)).toFixed(2))
    });
    grouped.set(Number(row.order_id), list);
  }
  return orders.map((order) => ({ ...order, items: grouped.get(order.id) || [] }));
}

async function placeOrder(req, res, next) {
  try {
    const result = await checkout(req.user.id);
    res.status(201).json({
      message: 'Order placed successfully (simulated payment).',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function myOrders(req, res, next) {
  try {
    const rows = await getSql().query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [req.user.id]
    );
    res.json({ orders: await attachItems(rows.map(toOrder)) });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const id = Number(req.params.id);
    const rows = await getSql().query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = ?`,
      [id]
    );
    if (!rows[0]) throw httpError(404, 'Order not found.');
    const order = toOrder(rows[0]);
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      throw httpError(403, 'You can only view your own orders.');
    }
    const [detailed] = await attachItems([order]);
    res.json({ order: detailed });
  } catch (err) {
    next(err);
  }
}

async function adminListOrders(req, res, next) {
  try {
    const rows = await getSql().query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC`
    );
    res.json({ orders: await attachItems(rows.map(toOrder)) });
  } catch (err) {
    next(err);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || '').trim();
    if (!ALLOWED_STATUS.includes(status)) {
      throw httpError(400, 'Status must be one of: ' + ALLOWED_STATUS.join(', '));
    }
    const result = await getSql().execute('UPDATE orders SET status = ? WHERE id = ?', [
      status,
      id
    ]);
    if (!result.affectedRows) throw httpError(404, 'Order not found.');
    const rows = await getSql().query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [id]
    );
    res.json({ order: toOrder(rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { placeOrder, myOrders, getOrder, adminListOrders, adminUpdateStatus };
