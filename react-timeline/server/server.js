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

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://timeline_user:4r5t6y7u8I@timeline-cluster.xsx3fwr.mongodb.net/Timeline?retryWrites=true&w=majority&appName=timeline-cluster';
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI configured:', mongoUri ? 'Yes' : 'No');
console.log('Using fallback URI:', !process.env.MONGODB_URI);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Connected to database:', mongoose.connection.name);
    // Debug: Check if we can access the searches collection
    mongoose.connection.db.collection('searches').countDocuments()
      .then(count => {
        console.log(`Number of documents in searches collection: ${count}`);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection string used:', mongoUri.replace(/:[^:]*@/, ':****@')); // Hide password in logs
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

// Debug endpoint to check environment variables
app.get('/debug', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    mongoUriSet: !!process.env.MONGODB_URI,
    mongoConnection: mongoose.connection.readyState,
    connectionName: mongoose.connection.name
  });
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
