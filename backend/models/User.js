const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Contact Info
  phone: { type: String },
  wilaya: { type: String },
  commune: { type: String },
  address: { type: String },
  
  // Data Sync
  wishlist: [{
    _id: String,
    name: String,
    price: Number,
    imageUrl: String,
    category: String
  }],
  cart: [{
    productId: String,
    name: String,
    price: Number,
    image: String,
    quantity: Number,
    color: String,
    size: String
  }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
