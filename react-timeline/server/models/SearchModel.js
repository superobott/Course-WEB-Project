const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  query: String,
  fullText: String,
  timelineEvents: Array,
  images: Array,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Search', searchSchema, 'searches'); // Add collection name explicitly
