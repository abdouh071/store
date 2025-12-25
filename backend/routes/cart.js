const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

/* ============================================================
   POST: Create new cart (returns cartId)
   ============================================================ */
router.post('/', async (req, res) => {
  try {
    const cartId = uuidv4();
    const newCart = new Cart({
      cartId,
      items: []
    });
    
    await newCart.save();
    res.json({ cartId, items: [] });
  } catch (err) {
    console.error('Error creating cart:', err);
    res.status(500).json({ error: 'Failed to create cart' });
  }
});

/* ============================================================
   GET: Get cart by cartId
   ============================================================ */
router.get('/:cartId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    res.json({ cartId: cart.cartId, items: cart.items });
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

/* ============================================================
   POST: Add item to cart
   ============================================================ */
router.post('/:cartId/items', async (req, res) => {
  try {
    const { productId, name, price, imageUrl, quantity, color, size, variants } = req.body;
    
    // Validate product and get stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let cart = await Cart.findOne({ cartId: req.params.cartId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    // Check if item already exists (matching product ID AND variants)
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && 
              (item.color || null) === (color || null) && 
              (item.size || null) === (size || null) &&
              (item.variants || null) === (variants || null)
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      const newQty = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock
      if (newQty > product.quantity) {
        const available = product.quantity - cart.items[existingItemIndex].quantity;
        if (available <= 0) {
          return res.status(400).json({ error: 'Out of stock', available: 0 });
        }
        return res.status(400).json({ 
          error: 'Insufficient stock',
          available,
          message: `Only ${available} more available`
        });
      }
      
      cart.items[existingItemIndex].quantity = newQty;
      cart.items[existingItemIndex].stock = product.quantity;
    } else {
      // Add new item
      if (quantity > product.quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          available: product.quantity
        });
      }
      
      cart.items.push({
        productId,
        name,
        price,
        imageUrl: imageUrl || '',
        quantity,
        color,
        size,
        variants,
        stock: product.quantity
      });
    }
    
    await cart.save();
    res.json({ cartId: cart.cartId, items: cart.items });
  } catch (err) {
    console.error('Error adding item to cart:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

/* ============================================================
   PUT: Update item quantity
   ============================================================ */
router.put('/:cartId/items/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === req.params.productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    // Validate against stock
    if (quantity > cart.items[itemIndex].stock) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: cart.items[itemIndex].stock
      });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    res.json({ cartId: cart.cartId, items: cart.items });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

/* ============================================================
   DELETE: Remove item from cart
   ============================================================ */
router.delete('/:cartId/items/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(
      item => item.productId.toString() !== req.params.productId
    );
    
    await cart.save();
    res.json({ cartId: cart.cartId, items: cart.items });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

/* ============================================================
   DELETE: Clear entire cart
   ============================================================ */
router.delete('/:cartId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ cartId: req.params.cartId });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ cartId: cart.cartId, items: [] });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
