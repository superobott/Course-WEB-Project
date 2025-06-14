require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize express
const app = express();

// Middleware
app.use(cors({
  origin: ['https://course-web-project.vercel.app'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.text({ type: '*/*' }));

// Database connection function
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('MongoDB connection URI not provided in environment variables');
    }

    // Close existing connection if exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      cachedDb = null;
    });

    cachedDb = mongoose.connection;
    console.log('Connected to MongoDB Atlas successfully');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB Atlas connection error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      mongoUri: process.env.MONGO_URI ? '[URI exists]' : '[URI missing]'
    });
    throw error;
  }
}

// Routes
const timelineRoutes = require('./routes/timelineRoutes');
const userRoutes = require('./routes/userRoutes');
const bubbleTimelineRoutes = require('./routes/bubbleTimelineRoutes');

app.get('/searches', async (req, res) => {
  try {
    await connectToDatabase();
    const searches = await mongoose.connection.db.collection('searches').find({}).toArray();
    console.log('Fetched searches:', searches.length);
    res.json(searches);
  } catch (err) {
    console.error('Error in /searches:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      connectionState: mongoose.connection.readyState
    });
    res.status(500).json({
      message: 'Error fetching searches',
      error: err.message,
      details: err.name === 'MongoServerError' ? 'Database connection issue' : 'Server processing error'
    });
  }
});

// Use routes with database connection
app.use('/api/users', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}, userRoutes);

app.use('/', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}, timelineRoutes);

app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}, bubbleTimelineRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
    connectionState: mongoose.connection.readyState
  };
  
  console.error('Global error handler:', errorDetails);

  let statusCode = 500;
  let errorMessage = 'Internal server error';

  // Customize error response based on error type
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Invalid request data';
  } else if (err.name === 'MongoServerError') {
    errorMessage = 'Database operation failed';
  } else if (err.name === 'MongooseError') {
    errorMessage = 'Database connection error';
  }

  res.status(statusCode).json({
    message: errorMessage,
    error: err.message,
    details: errorDetails.name,
    path: errorDetails.path
  });
});

// Export the app for serverless use
module.exports = app;

// Only listen if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
