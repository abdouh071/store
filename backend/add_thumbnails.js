const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function addThumbnails() {
  try {
    // Connect to DB
    const uri = 'mongodb+srv://adou4849_db_user:0562abdou@es.vvomd4n.mongodb.net/?appName=Es';
    await mongoose.connect(uri);
    console.log('✅ Connected to DB');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    // Sample additional images (you can replace with real product images)
    const sampleImages = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400',
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400'
    ];

    let updated = 0;

    for (const product of products) {
      // Skip if product already has images
      if (product.images && product.images.length > 0) {
        console.log(`⏭️  Skipping ${product.name} - already has images`);
        continue;
      }

      // Add 2-3 random sample images to each product
      const numImages = Math.floor(Math.random() * 2) + 2; // 2 or 3 images
      const randomImages = [];
      
      for (let i = 0; i < numImages; i++) {
        const randomIndex = Math.floor(Math.random() * sampleImages.length);
        randomImages.push(sampleImages[randomIndex]);
      }

      // Update product with images
      product.images = randomImages;
      await product.save();
      
      console.log(`✅ Updated ${product.name} with ${numImages} thumbnail images`);
      updated++;
    }

    console.log(`\n🎉 Successfully updated ${updated} products with thumbnail images!`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

addThumbnails();
