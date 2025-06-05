const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TimelineModel = require('../models/TimelineModel');
const User = require('../models/UserModel');
const requireAuthentication = require('../utils/requireAuthentication');
const { generateTimelineFromGemini } = require('../utils/gemini');
const { fetchUnsplashImages } = require('../utils/fetchTimelineImages');
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
router.get('/search', requireAuthentication, async (req, res) => {
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
    let cachedData = await TimelineModel.findOne({ query: query.toLowerCase() });
    if (cachedData) {
      console.log(`Found "${query}" in DB.`);

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
      images=[];
      console.log("term doesnt found");
    } else {
      fullText = page.extract || `No extract available from Wikipedia for "${query}".`;
      timelineEvents = await generateTimelineFromGemini(fullText);
      timelineEvents = sortTimelineEvents(timelineEvents);
      timelineEvents = timelineEvents.filter(event => extractYear(event.date) !== null);
      images = await fetchUnsplashImages(query); 
      console.log(`Gemini generated ${timelineEvents.length} events.`);
      console.log(`Found ${images.length} images`);
    }

    // Start a MongoDB session for the transaction
    const session = await mongoose.startSession();
    let newSearch;
    
    try {
      await session.withTransaction(async () => {
        // Save search in Search collection within the transaction
        newSearch = new Search({
          query: query.toLowerCase(),
          fullText,
          timelineEvents,
          images,
          userId: req.user._id,
          createdAt: new Date()
        });
        
        await newSearch.save({ session });

        // Update user's search history atomically within the same transaction
        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          {
            $push: {
              searchHistory: {
                $each: [{
                  query: query,
                  searchId: newSearch._id,
                  createdAt: new Date()
                }],
                $position: 0, // Add at the beginning of the array
                $slice: 100 // Keep only the last 100 searches
              }
            }
          },
          { 
            new: true, 
            runValidators: true,
            session 
          }
        );

        if (!updatedUser) {
          throw new Error('Failed to update user search history');
        }

        console.log('Updated search history:', updatedUser.searchHistory);
        console.log(`Saved "${query}" to user's search history`);
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }

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
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Failed to process search request.', details: error.message });
  }
});

module.exports = router;
