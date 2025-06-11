const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
console.log('📦 bubbleTimelineRoutes.js loaded');


router.get('/dataset', async (req, res) => {
  
  console.log('Reached bubbleTimelineRoutes GET /api/dataset');
  const { topic, type } = req.query;

  console.log('📥 GET /api/dataset');
  console.log('🔍 Type (field):', type);
  console.log('🔍 Topic (value):', topic);

  const collection = mongoose.connection.db.collection('dataset');

  const query = {
    [type]: { $regex: topic, $options: 'i' } 
  };

  console.log('🧪 Query:', query);

  try {
    const results = await collection.find(query).toArray();
    console.log(`✅ Found ${results.length} documents`);
    res.json(results);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
