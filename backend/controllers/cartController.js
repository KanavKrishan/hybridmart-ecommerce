const Cart = require('../models/Cart');
const { getSql } = require('../config/db');
const { getProductMap, requireProduct } = require('../services/productLookup');
const { httpError } = require('../middleware/errorHandler');

function toMoney(value) {
  return Number(Number(value).toFixed(2));
}

async function hydrateCart(userId) {
  const cart = await Cart.findOne({ user_id: userId });
  const items = cart?.items || [];
  const map = await getProductMap(
    getSql(),
    items.map((i) => i.product_id)
  );
  const hydrated = [];
  let subtotal = 0;
  for (const item of items) {
    const product = map.get(Number(item.product_id));
    if (!product) continue;
    const lineTotal = toMoney(product.price * item.quantity);
    subtotal = toMoney(subtotal + lineTotal);
    hydrated.push({
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      price: product.price,
      stock: product.stock,
      quantity: item.quantity,
      line_total: lineTotal
    });
  }
  return {
    items: hydrated,
    subtotal,
    total: subtotal,
    updated_at: cart?.updated_at || null
  };
}

async function getCart(req, res, next) {
  try {
    res.json(await hydrateCart(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity || 1);
    if (!Number.isInteger(productId) || productId < 1) {
      throw httpError(400, 'A valid product_id is required.');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw httpError(400, 'Quantity must be a positive whole number.');
    }
    const product = await requireProduct(getSql(), productId);
    if (product.stock < 1) throw httpError(409, 'This product is out of stock.');

    let cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) cart = new Cart({ user_id: req.user.id, items: [] });

    const existing = cart.items.find((i) => Number(i.product_id) === productId);
    const nextQty = (existing ? existing.quantity : 0) + quantity;
    if (nextQty > product.stock) {
      throw httpError(409, `Only ${product.stock} units are available.`);
    }
    if (existing) existing.quantity = nextQty;
    else cart.items.push({ product_id: productId, quantity });
    await cart.save();
    res.status(201).json(await hydrateCart(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw httpError(400, 'Quantity must be a positive whole number.');
    }
    const product = await requireProduct(getSql(), productId);
    if (quantity > product.stock) {
      throw httpError(409, `Only ${product.stock} units are available.`);
    }
    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) throw httpError(404, 'Cart is empty.');
    const item = cart.items.find((i) => Number(i.product_id) === productId);
    if (!item) throw httpError(404, 'That product is not in your cart.');
    item.quantity = quantity;
    await cart.save();
    res.json(await hydrateCart(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) throw httpError(404, 'Cart is empty.');
    cart.items = cart.items.filter((i) => Number(i.product_id) !== productId);
    await cart.save();
    res.json(await hydrateCart(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
