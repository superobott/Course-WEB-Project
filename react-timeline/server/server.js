require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Configure CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://course-web-project-37jp.vercel.app']
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.text({ type: '*/*' }));

// MongoDB connection with proper error handling for serverless
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://timeline_user:4r5t6y7u8I@timeline-cluster.xsx3fwr.mongodb.net/Timeline?retryWrites=true&w=majority&appName=timeline-cluster';
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI configured:', mongoUri ? 'Yes' : 'No');
console.log('Using fallback URI:', !process.env.MONGODB_URI);

// Configure mongoose for serverless
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);

// Connection function with retry logic
const connectToMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain a minimum of 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });
    
    console.log('MongoDB connected successfully');
    console.log('Connected to database:', mongoose.connection.name);
    
    // Test connection with searches collection
    try {
      const count = await mongoose.connection.db.collection('searches').countDocuments();
      console.log(`Number of documents in searches collection: ${count}`);
    } catch (collectionError) {
      console.log('Searches collection not accessible or doesn\'t exist yet');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Connection string used:', mongoUri.replace(/:[^:]*@/, ':****@'));
    throw err;
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Initial connection
connectToMongoDB().catch(err => {
  console.error('Failed to connect to MongoDB on startup:', err);
});

// Middleware to ensure MongoDB connection before handling requests
const ensureMongoConnection = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, attempting to reconnect...');
      await connectToMongoDB();
    }
    next();
  } catch (error) {
    console.error('Failed to ensure MongoDB connection:', error);
    res.status(503).json({ 
      message: 'Database connection unavailable',
      details: 'Please try again in a moment'
    });
  }
};

// Apply connection middleware to all routes
app.use(ensureMongoConnection);

// Use routes
const timelineRoutes = require('./routes/timelineRoutes');
const userRoutes = require('./routes/userRoutes');
const bubbleTimelineRoutes = require('./routes/bubbleTimelineRoutes');

app.get('/searches', async (req, res) => {
  try {
    const searches = await mongoose.connection.db.collection('searches').find({}).toArray();
    console.log('Fetched searches:', searches.length);
    res.json(searches);
  } catch (err) {
    console.error('Error fetching searches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check environment variables and connection status
app.get('/debug', (req, res) => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    nodeEnv: process.env.NODE_ENV,
    mongoUriSet: !!process.env.MONGODB_URI,
    mongoConnection: mongoose.connection.readyState,
    connectionState: connectionStates[mongoose.connection.readyState],
    connectionName: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    apiKeys: {
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      unsplashConfigured: !!process.env.UNSPLASH_ACCESS_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint specifically for dataset collections
app.get('/debug/collections', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionDetails = [];

    for (const collection of collections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        const sample = await mongoose.connection.db.collection(collection.name).findOne();
        
        collectionDetails.push({
          name: collection.name,
          count: count,
          sampleFields: sample ? Object.keys(sample) : []
        });
      } catch (err) {
        collectionDetails.push({
          name: collection.name,
          error: err.message
        });
      }
    }

    res.json({
      database: mongoose.connection.name,
      totalCollections: collections.length,
      collections: collectionDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/users', userRoutes);
app.use('/', timelineRoutes);
app.use('/api', bubbleTimelineRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, '..', 'build')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/search') || req.path.startsWith('/searches')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
