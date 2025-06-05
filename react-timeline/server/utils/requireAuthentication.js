const LoggedInUser = require('../models/LoggedInUserModel');
const User = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
  try {
    const userEmail = req.headers['user-email'];
    console.log('Auth: Received user email:', userEmail);
    
    if (!userEmail) {
      console.log('Auth: No user email in headers');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loggedInUser = await LoggedInUser.findOne({ email: userEmail });
    console.log('Auth: Found logged in user:', loggedInUser ? 'yes' : 'no');
    if (!loggedInUser) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    // Get user details and attach to request
    const user = await User.findOne({ email: userEmail });
    console.log('Auth: Found user in DB:', user ? user.email : 'no');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Auth: Setting user on request:', user.email, 'ID:', user._id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = authMiddleware;
