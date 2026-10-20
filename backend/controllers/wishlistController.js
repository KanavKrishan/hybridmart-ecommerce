const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const { getSql } = require('../config/db');
const { getProductMap, requireProduct } = require('../services/productLookup');
const { httpError } = require('../middleware/errorHandler');

async function hydrateWishlist(userId) {
  const doc = await Wishlist.findOne({ user_id: userId });
  const ids = doc?.product_ids || [];
  const map = await getProductMap(getSql(), ids);
  const products = ids
    .map((id) => map.get(Number(id)))
    .filter(Boolean);
  return { products, updated_at: doc?.updated_at || null };
}

async function getWishlist(req, res, next) {
  try {
    res.json(await hydrateWishlist(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function addToWishlist(req, res, next) {
  try {
    const productId = Number(req.body.product_id);
    await requireProduct(getSql(), productId);
    let doc = await Wishlist.findOne({ user_id: req.user.id });
    if (!doc) doc = new Wishlist({ user_id: req.user.id, product_ids: [] });
    if (!doc.product_ids.includes(productId)) doc.product_ids.push(productId);
    await doc.save();
    res.status(201).json(await hydrateWishlist(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function removeFromWishlist(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const doc = await Wishlist.findOne({ user_id: req.user.id });
    if (!doc) return res.json({ products: [], updated_at: null });
    doc.product_ids = doc.product_ids.filter((id) => Number(id) !== productId);
    await doc.save();
    res.json(await hydrateWishlist(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function moveToCart(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const product = await requireProduct(getSql(), productId);
    if (product.stock < 1) throw httpError(409, 'This product is out of stock.');

    let cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) cart = new Cart({ user_id: req.user.id, items: [] });
    const existing = cart.items.find((i) => Number(i.product_id) === productId);
    const nextQty = (existing ? existing.quantity : 0) + 1;
    if (nextQty > product.stock) {
      throw httpError(409, `Only ${product.stock} units are available.`);
    }
    if (existing) existing.quantity = nextQty;
    else cart.items.push({ product_id: productId, quantity: 1 });
    await cart.save();

    const wish = await Wishlist.findOne({ user_id: req.user.id });
    if (wish) {
      wish.product_ids = wish.product_ids.filter((id) => Number(id) !== productId);
      await wish.save();
    }
    res.json({ message: 'Moved to cart.', wishlist: await hydrateWishlist(req.user.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
