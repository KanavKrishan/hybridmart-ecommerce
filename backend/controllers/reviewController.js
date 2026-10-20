const Review = require('../models/Review');
const { getSql } = require('../config/db');
const { requireProduct } = require('../services/productLookup');
const { httpError } = require('../middleware/errorHandler');

async function hasPurchased(userId, productId) {
  const rows = await getSql().query(
    `SELECT oi.id
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND oi.product_id = ? AND o.status <> 'Cancelled'
     LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

async function addReview(req, res, next) {
  try {
    const productId = Number(req.body.product_id);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    await requireProduct(getSql(), productId);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw httpError(400, 'Rating must be a whole number from 1 to 5.');
    }
    if (comment.length < 3) throw httpError(400, 'Please write a short comment.');

    const bought = await hasPurchased(req.user.id, productId);
    if (!bought) {
      throw httpError(403, 'You can review a product only after you have purchased it.');
    }

    const existing = await Review.findOne({ product_id: productId, user_id: req.user.id });
    if (existing) throw httpError(409, 'You have already reviewed this product.');

    const review = await Review.create({
      product_id: productId,
      user_id: req.user.id,
      rating,
      comment
    });
    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return next(httpError(409, 'You have already reviewed this product.'));
    }
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const productId = Number(req.params.productId);
    const reviews = await Review.find({ product_id: productId }).sort({ created_at: -1 }).lean();
    const avg =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    res.json({
      reviews,
      average_rating: Number(avg.toFixed(2)),
      review_count: reviews.length
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { addReview, listReviews };
