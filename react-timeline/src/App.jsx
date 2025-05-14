import React, { useState, useEffect } from 'react';
import SearchBar from './components/searchBar';
import TimelineEvent from './components/TimelineEvent';
import './output.css';

const extractDatesWithContext = (text) => {
  const regex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}\b/g;
  const lines = text.split('\n');

  const monthMap = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11
  };

  const excludeKeywords = ['Archived', 'Retrieved', 'Accessed', 'Wayback', 'ISBN', 'doi'];

  const results = [];

  lines.forEach(line => {
    if (excludeKeywords.some(keyword => line.includes(keyword))) return;

    const match = line.match(regex);
    if (match) {
      match.forEach(dateStr => {
        const [monthName, year] = dateStr.split(' ');
        const dateObj = new Date(parseInt(year), monthMap[monthName]);

        results.push({
          date: dateStr,
          summary: line.trim(),
          sortDate: dateObj
        });
      });
    }
  });

  results.sort((a, b) => a.sortDate - b.sortDate);

  return results;
};

function App() {
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchFullPage = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(
            query
          )}&origin=*&explaintext=true`
        );
        const data = await res.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId]?.extract || 'No extract found';
        console.log('EXTRACT:', extract);

        setFullText(extract);

        const events = extractDatesWithContext(extract);
        setTimelineEvents(events);
      } catch (error) {
        setFullText('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchFullPage();
  }, [query]);

  return (
  <div style={{ padding: '20px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 className="text-4xl font-bold text-[#006A71] mb-4">Timeline Search</h1>
      <SearchBar onSearch={setQuery} />
      {query && !loading && <h2>{`"${query}"`}</h2>}
    </div>

    {loading ? (
      <p style={{ textAlign: 'center' }}>Loading...</p>
    ) : (
      <div className="timeline-container">
        <div className="timeline-line" />
        {timelineEvents.map((event, index) => (
          <TimelineEvent key={index} date={event.date} summary={event.summary} index={index} />
        ))}
      </div>
    )}
  </div>
);

}

export default App;
