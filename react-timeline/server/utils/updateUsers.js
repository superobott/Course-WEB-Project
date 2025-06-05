const mongoose = require('mongoose');
const User = require('../models/UserModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Timeline')
  .then(() => {
    console.log('MongoDB connected successfully');
    updateUsers();
  })
  .catch(err => console.error('MongoDB connection error:', err));

async function updateUsers() {
  try {
    // Update all users to include searchHistory if they don't have it
    const result = await User.updateMany(
      { searchHistory: { $exists: false } },
      { $set: { searchHistory: [] } }
    );

    console.log('Users updated:', result);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating users:', error);
    mongoose.connection.close();
  }
}
