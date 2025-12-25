const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');

// GET /api/reviews/store
// Fetch all store reviews
router.get('/store', async (req, res) => {
  try {
    const reviews = await Review.find({ type: 'store' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching store reviews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reviews/:productId
// Fetch all reviews for a specific product
router.get('/:productId([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId, type: 'product' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews
// Submit a new review
router.post('/', async (req, res) => {
  try {
    const { productId, userName, rating, comment, type = 'product' } = req.body;

    if (!userName || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required' });
    }

    if (type === 'product' && !productId) {
      return res.status(400).json({ error: 'Product ID is required for product reviews' });
    }

    const review = new Review({
      productId: type === 'product' ? productId : undefined,
      userName,
      rating,
      comment,
      type
    });

    await review.save();

    // Optional: Update Product's average rating ONLY for product reviews
    if (type === 'product') {
      const allReviews = await Review.find({ productId, type: 'product' });
      const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
      await Product.findByIdAndUpdate(productId, { rating: avgRating });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
