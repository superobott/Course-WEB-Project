import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import SearchBar from '../components/timeline/searchBar';
import Results from '../components/timeline/Results';
import Loading from '../components/common/Loading';
import ErrorBox from '../components/common/ErrorBox';
import '../style/pagestyle/Search.css';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const userId = localStorage.getItem('userId');

  const fetchSearchHistory = useCallback(async () => {
    try {
      if (!userId) return;
      
      const response = await fetch(`http://localhost:4000/api/users/search-history/${userId}`);
      if (response.ok) {
        const history = await response.json();
        setSearchHistory(history);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchSearchHistory();
  }, [fetchSearchHistory]);

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
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          navigate('/login');
          return;
        }

        const url = new URL('http://localhost:4000/search');
        url.searchParams.append('q', query);
        url.searchParams.append('startYear', startYear);
        url.searchParams.append('endYear', endYear);
        const response = await fetch(url, {
          headers: {
            'user-email': userEmail
          }
        });

        if (response.status === 401) {
          navigate('/login');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Something went wrong on the server.');
        }

        const data = await response.json();
        console.log('Data received from server:', data);
        
        setFullText(data.extract);
        setTimelineEvents(data.timelineEvents);
        setImages(data.images || []);
        
        // Refresh search history after updating data
        await fetchSearchHistory();
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
      <div className="content-wrapper">
        <h1 className="app-title">Timeline Search</h1>
        
        <SearchBar 
          onSearch={({ query, startYear, endYear }) => {
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
      </div>
      <Footer />
    </div>
  );
}

export default Search;
