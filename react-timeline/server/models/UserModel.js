const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Simple password comparison (temporary, not secure for production)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return this.password === candidatePassword;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
