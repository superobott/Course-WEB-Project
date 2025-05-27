require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

//connection to GEMINI API
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env file!');
  process.exit(1); 
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//connection to MongoDB
mongoose.connect('mongodb://localhost:27017/Timeline')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

//create a schema for the timeline
const timelineSchema = new mongoose.Schema({
  query: { type: String, unique: true, required: true },
  fullText: { type: String, required: true },
  timelineEvents: { type: [Object], default: [] },
  images: { type: [Object], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const TimelineModel = mongoose.model('Timeline', timelineSchema);

//Gemini timeline generation function
async function generateTimelineFromGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert historian and timeline creator, focused on extracting all significant historical events.
      Please provide ONLY a JSON array of events in this exact format:

      [
        { "date": "Month YYYY", "summary": "Detailed summary (at least two lines describing the event's significance and key details)." },
        ...
      ]

      Analyze the following text and extract ALL important historical events. For each event, provide the date in "Month YYYY" format and a comprehensive summary of at least two lines. The summary should explain the event's significance and include key details.

      IMPORTANT:
      - Do NOT write "AD" for modern dates. Just write "Month YYYY".
      - Use "BC" only if the event happened before the common era.
      - The date must always be in the format "Month YYYY".

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
async function fetchUnsplashImages(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=20`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log(`No images found on Unsplash for "${query}".`);
      return [];
    }

    const fetchedImages = data.results.map((img) => ({
      src: img.urls.small,  // את יכולה לשנות ל-regular או full אם את רוצה איכות גבוהה יותר
      alt: img.alt_description || `Image of ${query}`,
    }));

    console.log(`Fetched ${fetchedImages.length} images from Unsplash for "${query}".`);
    return fetchedImages;

  } catch (error) {
    console.error("Error fetching images from Unsplash:", error);
    return [];
  }
}

// Function to sort timeline events by date
function sortTimelineEvents(events) {
        return events.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
       });
}
//Routes
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
        images: cachedData.images,
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
    let images = [];

    if (page.missing) {
      fullText = `No exact match found on Wikipedia for "${query}".`;
    } else {
      fullText = page.extract || 'No extract available from Wikipedia.';
      timelineEvents = await generateTimelineFromGemini(fullText);
      timelineEvents = sortTimelineEvents(timelineEvents);
      images = await fetchUnsplashImages(query); 
      console.log(`Gemini generated ${timelineEvents.length} events.`);
      console.log(`Found ${images.length} images from Wikipedia.`);
    }

    const newTimelineEntry = new TimelineModel({
      query: query.toLowerCase(),
      fullText,
      timelineEvents,
      images,
    });

    await newTimelineEntry.save();
    console.log(`Saved "${query}" to DB.`);

    return res.json({
      extract: fullText,
      timelineEvents,
      images, 
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
