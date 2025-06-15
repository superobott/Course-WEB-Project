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

// Simple MongoDB connection for serverless
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://timeline_user:4r5t6y7u8I@timeline-cluster.xsx3fwr.mongodb.net/Timeline?retryWrites=true&w=majority&appName=timeline-cluster';

console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);

// Configure mongoose for serverless
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);

// Simple connection
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}).then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database name:', mongoose.connection.name);
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// Simple connection check middleware (removed automatic reconnection to avoid crashes)
const checkConnection = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
    res.status(503).json({ 
      message: 'Database connection unavailable',
      details: 'Please try again in a moment'
    });
  }
};

// Apply connection middleware only to database routes
app.use('/api', checkConnection);
app.use('/search', checkConnection);

// Simple test endpoint (no database required)
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// Simple debug endpoint for collections
app.get('/debug/collections', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const collectionNames = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      database: mongoose.connection.name,
      collections: collectionNames.map(c => c.name)
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
