const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin Login (Hardcoded for now, as per original)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ==================== Customer Auth ====================

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();

    // Create Token
    const token = jwt.sign({ id: user._id }, process.env.SESSION_SECRET || 'secret', { expiresIn: '30d' });

    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, wishlist: user.wishlist, cart: user.cart } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.SESSION_SECRET || 'secret', { expiresIn: '30d' });

    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, wishlist: user.wishlist, cart: user.cart } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'secret');
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, phone, wilaya, commune, address } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (wilaya) user.wilaya = wilaya;
    if (commune) user.commune = commune;
    if (address) user.address = address;

    await user.save();

    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        wilaya: user.wilaya,
        commune: user.commune,
        address: user.address,
        wishlist: user.wishlist, 
        cart: user.cart 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get Current User (Protected)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const Cart = require('../models/Cart');

// Sync Data (Wishlist/Cart)
router.put('/sync', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'secret');
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { wishlist, cartId } = req.body;
    
    // 1. Sync Wishlist
    if (wishlist) user.wishlist = wishlist;

    // 2. Sync Cart (from Session Cart to User Cart)
    if (cartId) {
      const sessionCart = await Cart.findOne({ cartId });
      if (sessionCart && sessionCart.items.length > 0) {
        user.cart = sessionCart.items;
      }
    }

    await user.save();
    res.json({ success: true, wishlist: user.wishlist, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
