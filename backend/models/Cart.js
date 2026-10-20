const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product_id: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, unique: true, index: true },
  items: { type: [cartItemSchema], default: [] },
  updated_at: { type: Date, default: Date.now }
});

cartSchema.pre('save', function stamp(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
