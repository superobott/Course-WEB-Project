const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  query: { type: String, unique: true, required: true },
  fullText: { type: String, required: true },
  timelineEvents: { type: [Object], default: [] },
  images: { type: [Object], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Timeline', timelineSchema);