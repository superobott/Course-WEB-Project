// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // יש לוודא שמותקן: npm install node-fetch

// טעינת משתני סביבה אם יש (לדוגמה, עבור חיבור ל-DB מרוחק)
// require('dotenv').config();

const app = express();
const port = 4000;

// Middleware
app.use(cors()); // מאפשר בקשות מצד הלקוח (React)
app.use(bodyParser.json()); // מנתח בקשות עם גוף מסוג JSON

// חיבור ל-MongoDB
// ודא ש-MongoDB פועל על המחשב שלך או שנה את כתובת ה-URI לכתובת של ה-DB שלך
mongoose.connect('mongodb://localhost:27017/Timeline')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// הגדרת סכמה עבור נתוני ציר הזמן
const timelineSchema = new mongoose.Schema({
  query: { type: String, unique: true, required: true }, // מונח החיפוש - מפתח ייחודי
  fullText: { type: String, required: true }, // הטקסט המלא מוויקיפדיה
  timelineEvents: { type: [Object], default: [] }, // אירועי ציר הזמן שחולצו
  createdAt: { type: Date, default: Date.now }, // תאריך יצירה
});

const TimelineModel = mongoose.model('Timeline', timelineSchema);

// --- פונקציות עזר ---

/**
 * פונקציה לחילוץ תאריכים עם הקשר מהטקסט של ויקיפדיה.
 * מזהה תאריכים בפורמט "חודש שנה" (לדוגמה: "January 2023")
 * ומחזירה אותם עם הטקסט השורה הרלוונטית, ממוינים לפי תאריך.
 */
function extractDatesWithContext(text) {
  // Regex לזיהוי תאריכים בפורמט "חודש שנה" (לדוגמה: December 1999)
  const regex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}\b/g;
  const lines = text.split('\n'); // מפריד את הטקסט לשורות

  // מפה של חודשים למספרים (לצורך מיון תאריכים)
  const monthMap = {
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11
  };

  // מילות מפתח שיש לדלג עליהן (לרוב קישורים או הערות שוליים)
  const excludeKeywords = [
    'Archived', 'Retrieved', 'Accessed', 'Wayback Machine', 'ISBN', 'doi',
    'References', 'External links', 'Further reading', 'Coordinates',
    'Wikimedia Commons', 'Template'
  ];

  const results = [];

  lines.forEach(line => {
    // בודק אם השורה מכילה מילת מפתח שיש לדלג עליה
    if (excludeKeywords.some(keyword => line.includes(keyword))) {
      return; // מדלג על השורה הנוכחית
    }

    const matches = [...line.matchAll(regex)]; // מוצא את כל ההתאמות ל-regex בשורה
    if (matches.length > 0) {
      matches.forEach(match => {
        const dateStr = match[0]; // התאריך כפי שנמצא בטקסט (לדוגמה: "July 1969")
        const [monthName, year] = dateStr.split(' ');
        const dateObj = new Date(parseInt(year), monthMap[monthName]); // אובייקט Date לצורך מיון

        // מנקה את התקציר משאריות לא רצויות (לדוגמה: סוגריים, רווחים מיותרים)
        let summary = line.replace(/\[\d+\]/g, '').trim(); // מסיר מספרי הפניה כמו [1], [2]
        if (summary.length < 10 || summary.length > 500) { // מסנן תקצירים קצרים או ארוכים מדי
            return;
        }

        // בודק שלא הוכנס אירוע זהה כבר (לפי תאריך ותקציר)
        if (!results.some(res => res.summary === summary && res.date === dateStr)) {
          results.push({
            date: dateStr,
            summary: summary,
            sortDate: dateObj // אובייקט Date למיון
          });
        }
      });
    }
  });

  // ממיין את התוצאות לפי תאריך עולה
  results.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

  // מחזיר את הנתונים בפורמט הרצוי לצד הלקוח (ללא אובייקט ה-Date)
  return results.map(event => ({
    date: event.date,
    summary: event.summary,
  }));
}


// --- Routes ---

app.get('/search', async (req, res) => {
  console.log(`Received search request for: ${req.query.q}`);
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    // 1. נסה למצוא את המונח במטמון (DB)
    const cachedData = await TimelineModel.findOne({ query: query.toLowerCase() }); // חיפוש ללא תלות ברישיות
    if (cachedData) {
      console.log(`Found "${query}" in cache.`);
      return res.json({
        extract: cachedData.fullText,
        timelineEvents: cachedData.timelineEvents,
        source: 'cache'
      });
    }

    // 2. אם לא נמצא במטמון, שלוף מ-Wikipedia API
    console.log(`"${query}" not in cache. Fetching from Wikipedia...`);
    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=${encodeURIComponent(query)}&explaintext=1&redirects=1`;
    const wikipediaResponse = await fetch(wikipediaUrl);
    const wikipediaData = await wikipediaResponse.json();

    const pageId = Object.keys(wikipediaData.query.pages)[0];
    const page = wikipediaData.query.pages[pageId];

    let fullText = '';
    let timelineEvents = [];

    if (page.missing) {
      fullText = `No exact match found on Wikipedia for "${query}".`;
      console.log(fullText);
    } else {
      fullText = page.extract || 'No extract available from Wikipedia.';
      timelineEvents = extractDatesWithContext(fullText);
      console.log(`Extracted ${timelineEvents.length} timeline events.`);
    }

    // 3. שמור את הנתונים החדשים ב-DB
    const newTimelineEntry = new TimelineModel({
      query: query.toLowerCase(), // שמירה ללא תלות ברישיות
      fullText: fullText,
      timelineEvents: timelineEvents,
    });
    await newTimelineEntry.save();
    console.log(`Saved "${query}" to DB.`);

    return res.json({
      extract: fullText,
      timelineEvents: timelineEvents,
      source: 'wikipedia'
    });

  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Failed to process search request.', details: error.message });
  }
});

// הפעלת השרת
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});