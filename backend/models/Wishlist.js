const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, unique: true, index: true },
  product_ids: { type: [Number], default: [] },
  updated_at: { type: Date, default: Date.now }
});

wishlistSchema.pre('save', function stamp(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
