import React, { useState, useEffect } from 'react';
import Header from '../logic/Header';
import Footer from '../logic/Footer';
import SearchBar from '../logic/searchBar';
import Results from '../logic/Results';
import Loading from '../logic/Loading';
import ErrorBox from '../logic/ErrorBox';
import '../style/Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  useEffect(() => {
    if (!query) {
      setFullText('');
      setTimelineEvents([]);
      setImages([]);
      setError(null);
      return;
    }

    const fetchTimelineData = async () => {
      setLoading(true);
      setError(null);
      setFullText('');
      setTimelineEvents([]);
      setImages([]);

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
    const filteredImages = images.filter(img => img && img.src);
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
      }} />

      {loading && query && <Loading query={query} />}
      {error && <ErrorBox error={error} />}
      {!loading && !error && query && (
        <Results
          query={query}
          startYear={startYear}
          endYear={endYear}
          fullText={fullText}
          timelineEvents={timelineEvents}
          images={images}
          getSideImages={getSideImages}
        />
      )}
      <Footer />
    </div>
  );
}

export default Search;
