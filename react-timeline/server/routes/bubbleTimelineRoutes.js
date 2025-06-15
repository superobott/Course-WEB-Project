const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Retry function for database operations
const retryOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Dataset operation attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

router.get('/dataset', async (req, res) => {
  console.log('🎯 Reached bubbleTimelineRoutes GET /api/dataset');
  console.log('📝 Query params:', req.query);
  
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

    console.log('🔍 Database connection state:', mongoose.connection.readyState);
    console.log('🗄️ Database name:', mongoose.connection.name);

    // List all collections first to debug
    const collections = await retryOperation(async () => {
      return await mongoose.connection.db.listCollections().toArray();
    });
    
    console.log('📊 Available collections:', collections.map(c => c.name));

    // Try different possible collection names
    const possibleCollectionNames = ['dataset', 'datasets', 'timeline', 'data'];
    let collection = null;
    let collectionName = null;

    for (const name of possibleCollectionNames) {
      try {
        const testCollection = mongoose.connection.db.collection(name);
        const count = await retryOperation(async () => {
          return await testCollection.countDocuments();
        });
        
        console.log(`📈 Collection '${name}' has ${count} documents`);
        
        if (count > 0) {
          collection = testCollection;
          collectionName = name;
          break;
        }
      } catch (err) {
        console.log(`❌ Collection '${name}' not accessible:`, err.message);
      }
    }

    if (!collection) {
      return res.status(404).json({ 
        message: 'No dataset collection found',
        availableCollections: collections.map(c => c.name),
        searchedCollections: possibleCollectionNames
      });
    }

    console.log(`✅ Using collection: ${collectionName}`);

    // Get a sample document to understand the structure
    const sampleDoc = await retryOperation(async () => {
      return await collection.findOne();
    });
    
    console.log('📄 Sample document structure:', sampleDoc ? Object.keys(sampleDoc) : 'No documents found');

    // Try different query patterns
    const queries = [
      // Original query
      { [type]: { $regex: topic, $options: 'i' } },
      // Case-insensitive exact field match
      { [type]: topic },
      // Search in common field names
      { topic: { $regex: topic, $options: 'i' } },
      { name: { $regex: topic, $options: 'i' } },
      { title: { $regex: topic, $options: 'i' } },
      { subject: { $regex: topic, $options: 'i' } },
      // Text search across all fields
      { $text: { $search: topic } }
    ];

    let results = [];
    let successfulQuery = null;

    for (const query of queries) {
      try {
        console.log('🔍 Trying query:', JSON.stringify(query));
        
        const queryResults = await retryOperation(async () => {
          return await collection.find(query).limit(100).toArray();
        });
        
        console.log(`📊 Query result count: ${queryResults.length}`);
        
        if (queryResults.length > 0) {
          results = queryResults;
          successfulQuery = query;
          break;
        }
      } catch (queryError) {
        console.log('❌ Query failed:', JSON.stringify(query), queryError.message);
      }
    }

    console.log(`✅ Found ${results.length} results using query:`, JSON.stringify(successfulQuery));

    // If no results, try to get all documents to debug
    if (results.length === 0) {
      console.log('🔍 No results found, getting sample of all documents...');
      const allDocs = await retryOperation(async () => {
        return await collection.find().limit(5).toArray();
      });
      
      console.log('📄 Sample documents:', allDocs.map(doc => {
        const keys = Object.keys(doc);
        const sample = {};
        keys.slice(0, 5).forEach(key => {
          sample[key] = typeof doc[key] === 'string' ? doc[key].substring(0, 50) + '...' : doc[key];
        });
        return sample;
      }));
    }

    res.json(results);
    
  } catch (error) {
    console.error('💥 Dataset route error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      res.status(503).json({ message: 'Database connection failed. Please try again.' });
    } else {
      res.status(500).json({ 
        message: 'Server error', 
        details: error.message,
        topic: topic,
        type: type
      });
    }
  }
});

module.exports = router;
