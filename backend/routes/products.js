const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer(); // for multipart/form-data
require('dotenv').config();

/* ============================================================
   ✅ GET: All Products (optional category filter)
   ============================================================ */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.homeCategory) filter.homeCategory = req.query.homeCategory;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   🆕 HOME PAGE CATEGORY ENDPOINTS
   ============================================================ */

// ✅ Top Rated (can be filtered by homeCategory or rating)
router.get('/top-rated', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ homeCategory: 'top-rated' }, { rating: { $gte: 4.5 } }]
    }).sort({ createdAt: -1 }).limit(10);
    res.json(products);
  } catch (err) {
    console.error('Error fetching top-rated products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Trending
router.get('/trending', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ homeCategory: 'trending' }, { salesCount: { $gte: 10 } }]
    }).sort({ createdAt: -1 }).limit(10);
    res.json(products);
  } catch (err) {
    console.error('Error fetching trending products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ New Arrivals
router.get('/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ homeCategory: 'new-arrivals' }]
    }).sort({ createdAt: -1 }).limit(10);
    res.json(products);
  } catch (err) {
    console.error('Error fetching new arrivals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Featured Collection
router.get('/featured-collection', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ homeCategory: 'featured-collection' }]
    }).sort({ createdAt: -1 }).limit(10);
    res.json(products);
  } catch (err) {
    console.error('Error fetching featured collection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   ✅ GET: Single Product by ID
   ============================================================ */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ============================================================
   ✅ POST: Upload Single Image (for thumbnails and main image)
   ============================================================ */
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imgbbUploader = require('imgbb-uploader');
    const result = await imgbbUploader({
      apiKey: process.env.IMGBB_KEY,
      base64string: req.file.buffer.toString('base64')
    });
    
    res.json({ url: result.url });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/* ============================================================
   ✅ POST: Create New Product
   ============================================================ */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, previousPrice, quantity, category, homeCategory, images, variants } = req.body;
    
    let imageUrl = '';
    
    // Upload image to imgbb if provided
    if (req.file) {
      const imgbbUploader = require('imgbb-uploader');
      const result = await imgbbUploader({
        apiKey: process.env.IMGBB_KEY,
        base64string: req.file.buffer.toString('base64')
      });
      imageUrl = result.url;
    }
    
    // Parse images array from JSON string
    let thumbnails = [];
    if (images) {
      try {
        thumbnails = JSON.parse(images);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    
    // Parse variants array from JSON string
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        console.error('Error parsing variants:', e);
      }
    }
    
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      previousPrice: previousPrice ? parseFloat(previousPrice) : undefined,
      quantity: parseInt(quantity),
      category,
      homeCategory: homeCategory || '',
      imageUrl,
      images: thumbnails,
      variants: parsedVariants
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/* ============================================================
   ✅ PUT: Update Product
   ============================================================ */
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, previousPrice, quantity, category, homeCategory, images, variants } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Update basic fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (previousPrice !== undefined) product.previousPrice = previousPrice ? parseFloat(previousPrice) : undefined;
    if (quantity !== undefined) product.quantity = parseInt(quantity);
    if (category) product.category = category;
    if (homeCategory !== undefined) product.homeCategory = homeCategory;
    
    // Update image if new file provided
    if (req.file) {
      const imgbbUploader = require('imgbb-uploader');
      const result = await imgbbUploader({
        apiKey: process.env.IMGBB_KEY,
        base64string: req.file.buffer.toString('base64')
      });
      product.imageUrl = result.url;
    }
    
    // Update thumbnails array
    if (images) {
      try {
        product.images = JSON.parse(images);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    
    // Update variants
    if (variants) {
      try {
        product.variants = JSON.parse(variants);
      } catch (e) {
        console.error('Error parsing variants:', e);
      }
    }
    
    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/* ============================================================
   ✅ DELETE: Delete Product
   ============================================================ */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* ============================================================
   ✅ POST: Bulk Delete Products
   ============================================================ */
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    
    const result = await Product.deleteMany({ _id: { $in: ids } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No products found to delete' });
    }
    
    res.json({ success: true, count: result.deletedCount });
  } catch (err) {
    console.error('Error deleting products:', err);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

module.exports = router;
