// backend/clear_thumbnails.js
// Clears all thumbnail URLs (the `images` field) from every product.
// Run this script once to remove existing test thumbnails.

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function clearThumbnails() {
  try {
    const uri = 'mongodb+srv://adou4849_db_user:0562abdou@es.vvomd4n.mongodb.net/?appName=Es';
    await mongoose.connect(uri);
    console.log('✅ Connected to DB');

    const result = await Product.updateMany({}, { $set: { images: [] } });
    const updated = result.modifiedCount ?? result.nModified ?? 0;
    console.log(`✅ Cleared thumbnails on ${updated} product(s).`);
  } catch (err) {
    console.error('❌ Error clearing thumbnails:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB');
  }
}

clearThumbnails();
