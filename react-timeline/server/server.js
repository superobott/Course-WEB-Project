require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize express
const app = express();

// CORS configuration based on environment
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://course-web-project.vercel.app']
    : ['http://localhost:3000'], // Allow local React development server
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.text({ type: '*/*' }));

// Database connection function
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return cachedDb;
  }

  try {
    // Check if MongoDB is running locally first
    const { exec } = require('child_process');
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log('Checking if MongoDB is running locally...');
      exec('mongod --version', (error, stdout, stderr) => {
        if (error) {
          console.error('MongoDB might not be installed:', error.message);
          console.log('Please install MongoDB or start the MongoDB service');
        } else {
          console.log('MongoDB is installed');
        }
      });
    }

    // Try local connection first in development
    const mongoUri = isProduction 
      ? (process.env.MONGO_URI || process.env.MONGO_URL)
      : 'mongodb://127.0.0.1:27017/Timeline'; // Using 127.0.0.1 instead of localhost

    if (!mongoUri) {
      throw new Error('MongoDB connection URI not provided in environment variables');
    }

    // Log connection attempt
    console.log('\nDatabase Connection Info:');
    console.log('- Environment:', isProduction ? 'Production' : 'Development');
    console.log('- Connection URL:', 
      mongoUri.startsWith('mongodb://127.0.0.1') 
        ? mongoUri 
        : mongoUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://[USERNAME]:[PASSWORD]@'));
    console.log('- Current directory:', process.cwd());

    // Close existing connection if exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Connection options based on environment
    const mongoTimeout = parseInt(process.env.MONGODB_TIMEOUT, 10) || 15000;
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: mongoTimeout,
      socketTimeoutMS: mongoTimeout * 2,
      connectTimeoutMS: mongoTimeout,
      // Production specific options
      ...(process.env.NODE_ENV === 'production' ? {
        authSource: 'admin',
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: mongoTimeout,
        waitQueueTimeoutMS: mongoTimeout
      } : {
        // Local development specific options
        heartbeatFrequencyMS: 1000
      })
    };

    console.log('Attempting database connection...');
    await mongoose.connect(mongoUri, connectionOptions);
    console.log('Initial connection successful');

    mongoose.connection.on('error', (err) => {
      const errorInfo = {
        message: err.message,
        name: err.name,
        code: err.code,
        stack: err.stack
      };

      // Specific handling for authentication errors
      if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
        console.error('MongoDB Authentication Error:', {
          ...errorInfo,
          hint: 'Please verify MongoDB Atlas username and password in Vercel environment variables'
        });
      } else {
        console.error('MongoDB Connection Error:', errorInfo);
      }

    // Reset cached connection and attempt reconnect for non-fatal errors
    if (!err.message.includes('bad auth')) {
      console.log('Attempting to reconnect...');
      cachedDb = null;
      setTimeout(() => connectToDatabase().catch(console.error), 5000);
    } else {
      cachedDb = null;
    }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected - Connection state:', mongoose.connection.readyState);
      cachedDb = null;
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully - Connection state:', mongoose.connection.readyState);
    });

    cachedDb = mongoose.connection;
    
    // Verify database access
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB Atlas connection and authentication successful');
    
    return cachedDb;
  } catch (error) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    };

    // Handle specific errors
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('MongoDB Authentication Failed:', {
        ...errorInfo,
        hint: process.env.NODE_ENV === 'production' 
          ? 'Verify these points in Vercel:\n1. MONGO_URI environment variable is set\n2. Username and password are correct\n3. User has access to Timeline database'
          : 'For local development:\n1. Ensure MongoDB is installed: Run "mongod --version"\n2. Start MongoDB:\n   - Windows: net start MongoDB\n   - Mac/Linux: sudo service mongod start\n3. Try using "127.0.0.1" instead of "localhost"\n4. Check MongoDB status: mongo or mongosh\n5. Default URL: mongodb://127.0.0.1:27017/Timeline'
      });
      throw new Error(process.env.NODE_ENV === 'production'
        ? 'MongoDB Authentication Failed: Please check credentials in Vercel environment variables'
        : 'MongoDB Connection Failed: Please ensure local MongoDB server is running');
    } else {
      console.error('MongoDB Atlas Connection Error:', {
        ...errorInfo,
        mongoUriExists: !!process.env.MONGO_URI,
        connectionState: mongoose.connection.readyState
      });
      throw error;
    }
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

// Cleanup on serverless environment shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received - Cleaning up...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
  }
  process.exit(0);
});

// Export handler for serverless use
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      message: 'Server initialization error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: error.name
    });
  }
};

// Only listen if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
