const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const LoggedInUser = require('../models/LoggedInUserModel');

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt for:', req.body.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      searchHistory: []
    });

    await user.save();
    console.log('User registered successfully:', email);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ message: 'Error registering user', details: error.message });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      // Check if email is already taken by another user
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: req.params.userId } 
      });
      
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (password) {
      user.password = password;
    }

    await user.save();
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      email: user.email
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (password !== user.password) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await LoggedInUser.create({ email });
    console.log('User logged in successfully:', email);

    res.json({
      success: true,
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    res.status(500).json({ message: 'Error logging in', details: error.message });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { email } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await LoggedInUser.deleteOne({ email });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});

// Get user's search history
router.get('/search-history/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.searchHistory || []);
  } catch (err) {
    console.error('Search history fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add search to history
router.post('/search-history', async (req, res) => {
  try {
    const { userId, query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const searchTerm = query.trim().toLowerCase();
    if (!user.searchHistory.includes(searchTerm)) {
      user.searchHistory.unshift(searchTerm);
      if (user.searchHistory.length > 10) { // Keep only last 10 searches
        user.searchHistory = user.searchHistory.slice(0, 10);
      }
      await user.save();
    }

    res.json(user.searchHistory);
  } catch (err) {
    console.error('Error adding to search history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
