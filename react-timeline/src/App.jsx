import React, { useState, useEffect } from 'react';
import SearchBar from './components/searchBar';
import TimelineEvent from './components/TimelineEvent';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css'; 


function App() {
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    if (!query) {
      setFullText('');
      setTimelineEvents([]);
      setSource('');
      setError(null);
      return;
    }

    const fetchTimelineData = async () => {
      setLoading(true);
      setError(null);
      setFullText('');
      setTimelineEvents([]);
      setSource('');

      try {
        const response = await fetch(`http://localhost:4000/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Something went wrong on the server.');
        }

        const data = await response.json();
        console.log('Data received from server:', data);

        setFullText(data.extract);
        setTimelineEvents(data.timelineEvents);
        setSource(data.source);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load timeline: ${err.message}`);
        setFullText('');
        setTimelineEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [query]);

  return (
    <div className="app-container">

      <Header />
      <h1 className="app-title">Timeline Search</h1>

      <SearchBar onSearch={setQuery} />

      {query && (
        <p className="search-query-display">
          {`Searching for: `}
          <span className="query-text">{query}</span>
        </p>
      )}

      {loading && (
        <p className="loading-message">Loading timeline...</p>
      )}

      {error && (
        <div className="error-box">
          <p className="error-title">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && query && fullText && (
        <div className="results-container">
          <h2 className="results-title">
            {`Results for "${query}" `}
            {source && <span className="source-text">({source})</span>}
          </h2>
          <details className="full-text-details">
            <summary className="full-text-summary">Show Wikipedia summary</summary>
              <p className="full-text-display">{fullText}</p>
          </details>

          {timelineEvents.length > 0 ? (
            <div className="timeline-events-container">
              {timelineEvents.map((event, index) => (
                <TimelineEvent
                  key={index}
                  date={event.date}
                  summary={event.summary}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="no-events-message">
              No specific timeline events found for "{query}" in the extract.
            </p>
          )}
        </div>
      )}

      {!loading && !error && query && !fullText && (
          <p className="no-data-message">
              No data found on Wikipedia for "{query}". Please try a different search term.
          </p>
      )}
      <Footer />
    </div>
  );
}

export default App;