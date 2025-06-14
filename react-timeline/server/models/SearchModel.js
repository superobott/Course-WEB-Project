const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  query: String,
  fullText: String,
  timelineEvents: Array,
  images: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Search', searchSchema, 'searches'); // Add collection name explicitly