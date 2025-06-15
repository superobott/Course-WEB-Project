require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Basic middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://timeline_user:4r5t6y7u8I@timeline-cluster.xsx3fwr.mongodb.net/Timeline?retryWrites=true&w=majority&appName=timeline-cluster';

// Simple connection without complex error handling
mongoose.connect(mongoUri).catch(() => {
  console.log('MongoDB connection failed');
});

// Routes with error handling
try {
  const userRoutes = require('./routes/userRoutes');
  const timelineRoutes = require('./routes/timelineRoutes');
  const bubbleTimelineRoutes = require('./routes/bubbleTimelineRoutes');

  app.use('/api/users', userRoutes);
  app.use('/search', timelineRoutes);
  app.use('/api', bubbleTimelineRoutes);
} catch (err) {
  console.log('Route loading error:', err.message);
}

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'build')));

// Fallback for React app
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/search')) {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  } catch {
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
