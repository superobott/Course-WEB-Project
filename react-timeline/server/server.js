require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

// Configure CORS for Vercel frontend
app.use(cors({
  origin: 'https://course-web-project.vercel.app',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.text({ type: '*/*' }));

// Connect to MongoDB Atlas with options
mongoose.connect('mongodb+srv://Team_20:Team_20@web-database.y3fu8pk.mongodb.net/Timeline?retryWrites=true&w=majority&appName=Web-DataBase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log('Connection URL:', mongoose.connection.client.s.url);
    // Debug: Check if we can access the searches collection
    mongoose.connection.db.collection('searches').countDocuments()
      .then(count => {
        console.log(`Number of documents in searches collection: ${count}`);
      })
      .catch(err => console.error('Error accessing searches collection:', err));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Use routes
const timelineRoutes = require('./routes/timelineRoutes');
const userRoutes = require('./routes/userRoutes');
const bubbleTimelineRoutes = require('./routes/bubbleTimelineRoutes');

app.get('/searches', async (req, res) => {
  try {
    const searches = await mongoose.connection.db.collection('searches').find({}).toArray();
    console.log('Fetched searches:', searches.length);
    res.json(searches);
  } catch (err) {
    console.error('Error fetching searches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use('/api/users', userRoutes);
app.use('/', timelineRoutes);
app.use('/api', bubbleTimelineRoutes);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
