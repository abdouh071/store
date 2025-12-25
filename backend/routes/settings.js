const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET: Retrieve site settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findById('site-settings');
    
    // Create default settings if none exist
    if (!settings) {
      settings = new Settings({ _id: 'site-settings' });
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT: Update site settings
router.put('/', async (req, res) => {
  try {
    const {
      storeName,
      logoUrl,
      heroTitle,
      heroSubtitle,
      categoryTitles,
      footerText
    } = req.body;
    
    let settings = await Settings.findById('site-settings');
    
    if (!settings) {
      settings = new Settings({ _id: 'site-settings' });
    }
    
    // Update fields if provided
    if (storeName !== undefined) settings.storeName = storeName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (heroTitle !== undefined) settings.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
    if (categoryTitles !== undefined) {
      settings.categoryTitles = {
        ...settings.categoryTitles,
        ...categoryTitles
      };
    }
    if (footerText !== undefined) settings.footerText = footerText;
    
    settings.updatedAt = Date.now();
    await settings.save();
    
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
