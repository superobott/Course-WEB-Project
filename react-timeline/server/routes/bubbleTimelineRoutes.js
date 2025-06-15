const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/dataset', async (req, res) => {
  const { topic, type } = req.query;
  
  if (!topic || !type) {
    return res.status(400).json({ 
      message: 'Both topic and type parameters are required'
    });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const collection = mongoose.connection.db.collection('dataset');
    const query = { [type]: { $regex: topic, $options: 'i' } };
    const results = await collection.find(query).limit(100).toArray();

    res.json(results);
    
  } catch (error) {
    console.error('Dataset error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
