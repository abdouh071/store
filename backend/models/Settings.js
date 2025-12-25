const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // There will only be one settings document
  _id: { type: String, default: 'site-settings' },
  
  // Branding
  storeName: { type: String, default: 'Clothing Store' },
  logoUrl: { type: String, default: '' },
  
  // Hero Section
  heroTitle: { type: String, default: 'Discover Your Style' },
  heroSubtitle: { type: String, default: 'Shop the latest fashion trends and timeless classics. From casual comfort to standout looks — we\'ve got you covered.' },
  
  // Homepage Category Titles
  categoryTitles: {
    topRated: { type: String, default: '⭐ Top Rated' },
    trending: { type: String, default: '🔥 Trending Now' },
    newArrivals: { type: String, default: '🆕 New Arrivals' },
    featuredCollection: { type: String, default: 'Featured Collection' }
  },
  
  // Footer
  footerText: { type: String, default: 'Your one-stop destination for fashion. Discover the latest trends and timeless classics.' },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
