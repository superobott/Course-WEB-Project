const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/dataset', async (req, res) => {
  console.log('Dataset route called with params:', req.query);
  
  const { topic, type } = req.query;
  
  if (!topic || !type) {
    return res.status(400).json({ 
      message: 'Both topic and type parameters are required',
      received: { topic, type }
    });
  }

  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    console.log('Database connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);

    // Try to access the dataset collection
    const collection = mongoose.connection.db.collection('dataset');
    
    // Simple query first
    const query = { [type]: { $regex: topic, $options: 'i' } };
    console.log('Executing query:', JSON.stringify(query));
    
    const results = await collection.find(query).limit(100).toArray();
    console.log(`Found ${results.length} results`);
    
    if (results.length === 0) {
      // Try to get total document count and sample
      const totalCount = await collection.countDocuments();
      console.log(`Total documents in collection: ${totalCount}`);
      
      if (totalCount > 0) {
        const sample = await collection.findOne();
        console.log('Sample document fields:', sample ? Object.keys(sample) : 'No documents');
      }
    }

    res.json(results);
    
  } catch (error) {
    console.error('Dataset route error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: error.message
    });
  }
});

module.exports = router;
