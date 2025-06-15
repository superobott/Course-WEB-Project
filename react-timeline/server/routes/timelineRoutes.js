const express = require('express');
const router = express.Router();
const TimelineModel = require('../models/TimelineModel');
const { generateTimelineFromGemini } = require('../utils/gemini');
const { fetchUnsplashImages } = require('../utils/unsplash');
const Search = require('../models/SearchModel');
const { sortTimelineEvents, extractYear, filterTimelineEventsByYear } = require('../utils/timelineUtils');
const fetch = require('node-fetch');

// Retry function for database operations
const retryOperation = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Timeline operation attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};


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
  console.log('🔍 Search route called with query:', req.query);
  
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

  console.log(`🎯 Processing search for: "${query}" (${startYear} - ${endYear})`);

  try {
    // Check for cached data with retry
    console.log('📋 Checking cache for query:', query.toLowerCase());
    let cachedData = await retryOperation(async () => {
      return await TimelineModel.findOne({ query: query.toLowerCase() });
    });
    
    if (cachedData) {
      console.log(`✅ Found "${query}" in DB cache.`);

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

    console.log('🌐 No cache found, fetching from Wikipedia...');
    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=${encodeURIComponent(query)}&explaintext=1&redirects=1`;
    console.log('🔗 Wikipedia URL:', wikipediaUrl);
    
    const wikipediaResponse = await fetch(wikipediaUrl);
    if (!wikipediaResponse.ok) {
      throw new Error(`Wikipedia API failed: ${wikipediaResponse.status} ${wikipediaResponse.statusText}`);
    }
    
    const wikipediaData = await wikipediaResponse.json();
    console.log('📄 Wikipedia response received');

    const pageId = Object.keys(wikipediaData.query.pages)[0];
    const page = wikipediaData.query.pages[pageId];
    let fullText = '';
    let timelineEvents = [];
    let images = [];

    if (page.missing) {
      fullText = `No exact match found on Wikipedia for "${query}".`;
      images = [];
      console.log('❌ Wikipedia: term not found');
    } else {
      fullText = page.extract || `No extract available from Wikipedia for "${query}".`;
      console.log(`📝 Wikipedia text length: ${fullText.length} characters`);
      
      console.log('🤖 Generating timeline with Gemini...');
      try {
        timelineEvents = await generateTimelineFromGemini(fullText);
        timelineEvents = sortTimelineEvents(timelineEvents);
        timelineEvents = timelineEvents.filter(event => extractYear(event.date) !== null);
        console.log(`✅ Gemini generated ${timelineEvents.length} events.`);
      } catch (geminiError) {
        console.error('❌ Gemini API error:', geminiError.message);
        timelineEvents = [];
      }
      
      console.log('🖼️ Fetching images from Unsplash...');
      try {
        images = await fetchUnsplashImages(query);
        console.log(`✅ Found ${images.length} images`);
      } catch (unsplashError) {
        console.error('❌ Unsplash API error:', unsplashError.message);
        images = [];
      }
    }

    // Save to database with retry
    console.log('💾 Saving to database...');
    await retryOperation(async () => {
      const newTimelineEntry = new TimelineModel({
        query: query.toLowerCase(),
        fullText,
        timelineEvents,
        images,
      });
      return await newTimelineEntry.save();
    });
    
    console.log(`✅ Saved "${query}" to DB.`);

    let filteredEvents = timelineEvents;
    if (startYear !== null && endYear !== null) {
      filteredEvents = filterTimelineEventsByYear(timelineEvents, startYear, endYear);
    }

    console.log(`📊 Returning ${filteredEvents.length} filtered events`);

    return res.json({
      extract: fullText,
      timelineEvents: filteredEvents,
      images, 
      source: 'wikipedia + gemini'
    });

  } catch (error) {
    console.error('💥 Error in /search:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
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