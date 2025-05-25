require('dotenv').config(); 

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

async function fetchWikipediaImages(query) {
  // Step 1: Get titles of all images on the page
  const imagesQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=images&titles=${encodeURIComponent(query)}&format=json&imlimit=50`; // imlimit to fetch up to 50 images

  try {
    const imagesResponse = await fetch(imagesQueryUrl);
    const imagesData = await imagesResponse.json();

    const pageId = Object.keys(imagesData.query.pages)[0];
    const page = imagesData.query.pages[pageId];

    if (!page || !page.images || page.images.length === 0) {
      console.log(`No images found for page "${query}" using prop=images.`);
      return [];
    }

    // Filter out common non-visual files or unwanted file types based on title
    const imageTitles = page.images
      .filter(img =>
        img.title &&
        !img.title.startsWith('File:Sound-icon') &&
        !img.title.startsWith('File:Commons-logo') && // Exclude Commons logo
        !img.title.startsWith('File:OOjs UI icon') &&  // Exclude OOjs icons
        !img.title.toLowerCase().includes('svg') &&    // Generally exclude SVG files (often icons/charts)
        !img.title.toLowerCase().includes('gif') &&    // Optionally exclude GIFs
        !img.title.toLowerCase().includes('flag') &&   // Optionally exclude flag icons
        !img.title.toLowerCase().includes('seal') &&   // Optionally exclude seals/emblems
        !img.title.toLowerCase().includes('map')       // Optionally exclude maps
      )
      .map(img => img.title);

    if (imageTitles.length === 0) {
      console.log(`No valid image titles extracted after initial filtering for "${query}".`);
      return [];
    }

    // Step 2: Get image URLs for these titles using prop=imageinfo
    // Ensure you fetch enough image info for all titles if the list is long
    const imageInfoQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|size|mime&titles=${imageTitles.map(encodeURIComponent).join('|')}&format=json&iiurlwidth=300`; // iiurlwidth for thumbnail size, adjust as needed

    const imageInfoResponse = await fetch(imageInfoQueryUrl);
    const imageInfoData = await imageInfoResponse.json();

    const fetchedImages = [];
    if (imageInfoData.query && imageInfoData.query.pages) {
      for (const pId in imageInfoData.query.pages) {
        const imgPage = imageInfoData.query.pages[pId];
        if (imgPage.imageinfo && imgPage.imageinfo.length > 0) {
          const info = imgPage.imageinfo[0];
          // Further filter based on MIME type, actual URL, and size/dimensions if available
          if (
            info.url &&
            info.mime &&
            info.mime.startsWith('image/') &&
            (info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp') && // Prioritize common image formats
            info.width > 50 && info.height > 50 // Filter out very small images/icons (adjust pixel values)
          ) {
            fetchedImages.push({
              src: info.url,
              alt: imgPage.title.replace('File:', '') || 'Image',
              // Add width/height if you want to use them in your frontend's TimelineImages component
              // width: info.width,
              // height: info.height,
            });
          }
        }
      }
    }

    console.log(`Successfully fetched ${fetchedImages.length} relevant images for "${query}".`);
    return fetchedImages;

  } catch (error) {
    console.error('Error fetching Wikipedia images:', error);
    return [];
  }
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
      images = await fetchWikipediaImages(query); 
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
