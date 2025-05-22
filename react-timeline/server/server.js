require('dotenv').config(); // טוען את קובץ .env במידת הצורך

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// --- ✨ Gemini config with API key from environment variable
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env file!');
  process.exit(1); // עצור את התהליך אם אין מפתח API
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- DB Setup
mongoose.connect('mongodb://localhost:27017/Timeline')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const timelineSchema = new mongoose.Schema({
  query: { type: String, unique: true, required: true },
  fullText: { type: String, required: true },
  timelineEvents: { type: [Object], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const TimelineModel = mongoose.model('Timeline', timelineSchema);

// --- ✨ Gemini timeline generation function
async function generateTimelineFromGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert historian and timeline creator.
      Please provide ONLY a JSON array of events in this exact format:

      [
      { "date": "1905", "summary": "Detailed description" },
      ...
      ]

      Analyze the following text and extract all relevant historical events, with detailed summaries.

      Text:"""${text}"""`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('Could not find JSON array in Gemini response');
      return [];
    }

    const jsonText = rawText.slice(jsonStart, jsonEnd + 1);

    try {
      return JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', e);
      return [];
    }

  } catch (error) {
    console.error('Gemini parsing error:', error);
    return [];
  }
}


// --- Routes
app.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const cachedData = await TimelineModel.findOne({ query: query.toLowerCase() });
    if (cachedData) {
      console.log(`Found "${query}" in DB.`);
      return res.json({
        extract: cachedData.fullText,
        timelineEvents: cachedData.timelineEvents,
        source: 'cache'
      });
    }

    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=${encodeURIComponent(query)}&explaintext=1&redirects=1`;
    const wikipediaResponse = await fetch(wikipediaUrl);
    const wikipediaData = await wikipediaResponse.json();

    const pageId = Object.keys(wikipediaData.query.pages)[0];
    const page = wikipediaData.query.pages[pageId];

    let fullText = '';
    let timelineEvents = [];

    if (page.missing) {
      fullText = `No exact match found on Wikipedia for "${query}".`;
    } else {
      fullText = page.extract || 'No extract available from Wikipedia.';
      timelineEvents = await generateTimelineFromGemini(fullText);
      console.log(`Gemini generated ${timelineEvents.length} events.`);
    }

    const newTimelineEntry = new TimelineModel({
      query: query.toLowerCase(),
      fullText,
      timelineEvents,
    });

    await newTimelineEntry.save();
    console.log(`Saved "${query}" to DB.`);

    return res.json({
      extract: fullText,
      timelineEvents,
      source: 'wikipedia + gemini'
    });

  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Failed to process search request.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
