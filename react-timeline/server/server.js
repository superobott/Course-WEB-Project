require('dotenv').config();

// Server Configuration
const CONFIG = {
  maxRetries: 3,
  timeout: 5000,
  endpoints: {
    users: '/api/users',
    timeline: '/',
    bubbleTimeline: '/api',
    searches: '/searches'
  }
};

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;
app.use(cors({
  origin: ['https://course-web-project.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.text({ type: '*/*' }));

// Connect to MongoDB
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI) 
  .then(() => {
    console.log('MongoDB connected successfully');
    // Debug: Check if we can access the searches collection
    mongoose.connection.db.collection('searches').countDocuments()
      .then(count => {
        console.log(`Number of documents in searches collection: ${count}`);
      });
  })
  .catch(err => console.error('MongoDB connection error:', err));

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

app.use('/api/users', userRoutes);
app.use('/', timelineRoutes);
app.use('/api', bubbleTimelineRoutes);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
