const mongoose = require('mongoose');

const loggedInUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoggedInUser', loggedInUserSchema);