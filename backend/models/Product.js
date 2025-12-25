const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  previousPrice: { type: Number }, // Original price before discount
  imageUrl: String,
  images: [String],
  variants: [{
    name: String, // e.g., "Size", "Color", "Material"
    options: [String] // e.g., ["S", "M", "L"] or ["Red", "Blue"]
  }],
  quantity: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['T-Shirts', 'Pants', 'Hats', 'Accessories', 'Shoes', 'Watches', 'Clothes', 'Other'],
    default: 'Other'
  },
  homeCategory: {
    type: String,
    enum: ['top-rated', 'trending', 'new-arrivals', 'featured-collection', ''],
    default: ''
  },
  rating: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
