const express = require('express');
const router = express.Router();
const TimelineModel = require('../models/TimelineModel');
const { generateTimelineFromGemini } = require('../utils/gemini');
const { fetchUnsplashImages } = require('../utils/unsplash');
const Search = require('../models/SearchModel');
const { sortTimelineEvents, extractYear, filterTimelineEventsByYear } = require('../utils/timelineUtils');
const fetch = require('node-fetch');


// Get all searches
router.get('/api/timeline/searches', async (req, res) => {
  try {
    console.log('Fetching all searches from MongoDB...'); // Debug log
    const searches = await Search.find().sort({ createdAt: -1 });
    console.log(`Found ${searches.length} searches`); // Debug log
    res.json(searches);
  } catch (err) {
    console.error('Error fetching searches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//Routes
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const startYearInput = req.query.startYear;
  const endYearInput = req.query.endYear;

  let startYear = extractYear(startYearInput); 
  let endYear = extractYear(endYearInput);

  if (startYear !== null && (endYear === null || endYearInput === undefined || endYearInput === "")) {
  endYear = new Date().getFullYear();
  }
  if ((startYear === null || startYearInput === undefined || startYearInput === "") && endYear !== null) {
    startYear = 1900;
  }

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    // Check for cached data
    let cachedData = await TimelineModel.findOne({ query: query.toLowerCase() });
    
    if (cachedData) {
      let filteredEvents = cachedData.timelineEvents;
      if (startYear !== null && endYear !== null) {
        filteredEvents = filterTimelineEventsByYear(filteredEvents, startYear, endYear);
      }

      return res.json({
        extract: cachedData.fullText,
        timelineEvents: filteredEvents,
        images: cachedData.images,
        source: 'cache'
      });
    }

    // Fetch from Wikipedia
    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=${encodeURIComponent(query)}&explaintext=1&redirects=1`;
    const wikipediaResponse = await fetch(wikipediaUrl);
    
    if (!wikipediaResponse.ok) {
      throw new Error(`Wikipedia API failed: ${wikipediaResponse.status}`);
    }
    
    const wikipediaData = await wikipediaResponse.json();
    const pageId = Object.keys(wikipediaData.query.pages)[0];
    const page = wikipediaData.query.pages[pageId];
    let fullText = '';
    let timelineEvents = [];
    let images = [];

    if (page.missing) {
      fullText = `No exact match found on Wikipedia for "${query}".`;
      images = [];
    } else {
      fullText = page.extract || `No extract available from Wikipedia for "${query}".`;
      
      // Generate timeline with Gemini
      try {
        timelineEvents = await generateTimelineFromGemini(fullText);
        timelineEvents = sortTimelineEvents(timelineEvents);
        timelineEvents = timelineEvents.filter(event => extractYear(event.date) !== null);
      } catch (geminiError) {
        console.error('Gemini error:', geminiError.message);
        timelineEvents = [];
      }
      
      // Fetch images from Unsplash
      try {
        images = await fetchUnsplashImages(query);
      } catch (unsplashError) {
        console.error('Unsplash error:', unsplashError.message);
        images = [];
      }
    }

    // Save to database
    const newTimelineEntry = new TimelineModel({
      query: query.toLowerCase(),
      fullText,
      timelineEvents,
      images,
    });
    await newTimelineEntry.save();

    let filteredEvents = timelineEvents;
    if (startYear !== null && endYear !== null) {
      filteredEvents = filterTimelineEventsByYear(timelineEvents, startYear, endYear);
    }

    return res.json({
      extract: fullText,
      timelineEvents: filteredEvents,
      images, 
      source: 'wikipedia + gemini'
    });

  } catch (error) {
    console.error('Search error:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      res.status(503).json({ error: 'Database connection failed. Please try again.' });
    } else if (error.message.includes('Wikipedia API failed')) {
      res.status(503).json({ error: 'Wikipedia service unavailable. Please try again.' });
    } else {
      res.status(500).json({ error: 'Failed to process search request.', details: error.message });
    }
  }
});

module.exports = router;