require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Timeline')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use routes
const timelineRoutes = require('./routes/timelineRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/users', userRoutes);
app.use('/', timelineRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
