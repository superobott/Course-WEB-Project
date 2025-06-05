const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true
  },
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Search',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  searchHistory: {
    type: [searchHistorySchema],
    default: [],
    required: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', function(next) {
  if (!this.searchHistory) {
    this.searchHistory = [];
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
