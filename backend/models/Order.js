const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // New structure for multi-item orders
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productTitle: String,
    productImageUrl: String,
    variants: String,
    qty: Number,
    price: Number
  }],
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Legacy fields (kept for backward compatibility, now optional)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productTitle: String,
  productImageUrl: String,
  customerName: { type: String, required: true },
  customerEmail: String,
  wilaya: String,
  commune: String,
  address: String,
  phone: String,
  color: String,
  size: String,
  variants: String,
  qty: { type: Number, default: 1 },
  totalPrice: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Declined', 'Shipped', 'Delivered'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
