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

// Simple connection check middleware
const checkConnection = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    res.status(503).json({ message: 'Database connection unavailable' });
  }
};

// Apply connection middleware to database routes
app.use('/api', checkConnection);
app.use('/search', checkConnection);

// Use routes
const timelineRoutes = require('./routes/timelineRoutes');
const userRoutes = require('./routes/userRoutes');
const bubbleTimelineRoutes = require('./routes/bubbleTimelineRoutes');

app.get('/searches', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('dataset');
    const searches = await collection.find({}).toArray();
    console.log('Fetched searches:', searches.length);
    res.json(searches);
  } catch (err) {
    console.error('Error fetching searches:', err);
    res.status(500).json({ message: 'Server error' });
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
