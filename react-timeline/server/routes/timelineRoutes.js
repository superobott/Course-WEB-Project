const express = require('express');
const router = express.Router();
const TimelineModel = require('../models/TimelineModel');
const { generateTimelineFromGemini } = require('../utils/gemini');
const { fetchUnsplashImages } = require('../utils/unsplash');
const { sortTimelineEvents, extractYear, filterTimelineEventsByYear } = require('../utils/timelineUtils');
const fetch = require('node-fetch');

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

    const newTimelineEntry = new TimelineModel({
      query: query.toLowerCase(),
      fullText,
      timelineEvents,
      images,
    });

    await newTimelineEntry.save();
    console.log(`Saved "${query}" to DB.`);

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