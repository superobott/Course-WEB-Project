import React, { useState, useEffect } from 'react';
import SearchBar from './components/logic/searchBar';
import TimelineEvent from './components/logic/TimelineEvent';
import Header from './components/logic/Header';
import Footer from './components/logic/Footer';
import TimelineImages from './components/logic/TimelineImages';
import './App.css'; 


function App() {
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');


  useEffect(() => {
    if (!query) {
      setFullText('');
      setTimelineEvents([]);
      setImages([]);
      setSource('');
      setError(null);
      return;
    }

    const fetchTimelineData = async () => {
      setLoading(true);
      setError(null);
      setFullText('');
      setTimelineEvents([]);
      setImages([]);
      setSource('');

      try {
        const url = new URL('http://localhost:4000/search');
        url.searchParams.append('q', query);
        url.searchParams.append('startYear', startYear);
        url.searchParams.append('endYear', endYear);
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Something went wrong on the server.');
        }

        const data = await response.json();
        console.log('Data received from server:', data);

        setFullText(data.extract);
        setTimelineEvents(data.timelineEvents);
        setImages(data.images || []);
        setSource(data.source);

      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load timeline: ${err.message}`);
        setFullText('');
        setTimelineEvents([]);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [query, startYear, endYear]);

  const getSideImages = (side) => {
    const filteredImages = images.filter(img => img && img.src)
    if (filteredImages.length === 0) return [];
    const half = Math.ceil(filteredImages.length / 2);
    if (side === 'left') {
      return filteredImages.slice(0, half);
    } else {
      return filteredImages.slice(half);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <h1 className="app-title">Timeline Search</h1>

      <SearchBar onSearch={({ query, startYear, endYear }) => {
        setQuery(query);
        setStartYear(startYear);
        setEndYear(endYear);
        }} 
      />

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
      {!loading && !error && query && (
        <div className="app-content-wrapper"> 
          <div className="side-column">
            <TimelineImages images={getSideImages('left')} />
          </div>

          <div className="main-column">
            {fullText ? (
              <div className="results-container">
                <h2 className="results-title">
                  {`Results for "${query}"`}
                  {(startYear || endYear) && (
                    <>
                      {` from: ${startYear || '1900'} to: ${endYear || '2024'}`}
                    </>
                  )}
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
            ) : (
              <p className="no-data-message">
                No data found on Wikipedia for "{query}". Please try a different search term.
              </p>
            )}
        </div>
      
      <div className="side-column">
        <TimelineImages images={getSideImages('right')} />
      </div>
    </div>
    )}

      <Footer />
  </div>
  );
}

export default App;