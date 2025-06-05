const express = require('express');
const User = require('../models/UserModel');
const router = express.Router();
const Search = require('../models/SearchModel'); 
const LoggedInUser = require('../models/LoggedInUserModel');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      searchHistory: []  // Initialize empty search history array
    });

    await user.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});


// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile route
router.put('/profile/:userId', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = email;
    }

    if (password) {
      user.password = password; 
    }

    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's search history
router.get('/search-history/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'searchHistory.searchId',
        model: 'Search',
        select: 'query fullText timelineEvents images createdAt'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.searchHistory);
  } catch (err) {
    console.error('Search history fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete search from history
router.delete('/search-history/:userId/:searchId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from user's search history
    user.searchHistory = user.searchHistory.filter(
      search => search.searchId.toString() !== req.params.searchId
    );
    await user.save();

    res.json({ message: 'Search removed from history' });
  } catch (err) {
    console.error('Delete search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    await LoggedInUser.create({ email });
    res.json({ 
      success: true,
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { email } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Logout request for:', email);
    await LoggedInUser.deleteOne({ email });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});

module.exports = router;
