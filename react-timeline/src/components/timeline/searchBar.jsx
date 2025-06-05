import React, { useState, useEffect, useCallback } from 'react';
import '../../style/componentsStyle/searchBar.css';

function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [error, setError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userId = localStorage.getItem('userId');

  // Fetch search suggestions based on user input
  const fetchSearchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm.trim() || !userId) return;

    try {
      const response = await fetch(`http://localhost:4000/api/users/search-history/${userId}`);
      if (response.ok) {
        const history = await response.json();
        const filteredSuggestions = history
          .filter(item => item.query.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5); // Limit to 5 suggestions
        setSearchSuggestions(filteredSuggestions);
      }
    } catch (err) {
      console.error('Failed to fetch search suggestions:', err);
    }
  }, [userId]);

  // Add search to history
  const addToSearchHistory = async (searchTerm) => {
    if (!searchTerm.trim() || !userId) return;

    try {
      const response = await fetch('http://localhost:4000/api/users/add-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          query: searchTerm,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add search to history');
      }
    } catch (err) {
      console.error('Error adding search to history:', err);
    }
  };

  useEffect(() => {
    if (term) {
      fetchSearchSuggestions(term);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [term, fetchSearchSuggestions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!term.trim()) {
      setError('Please enter a search term.');
      return;
    }
    setError('');
    setShowSuggestions(false);
    await addToSearchHistory(term);
    onSearch({
      query: term,
      startYear,
      endYear,
    });
  };

  const handleSuggestionClick = async (suggestion) => {
    setTerm(suggestion.query);
    setShowSuggestions(false);
    await addToSearchHistory(suggestion.query);
    onSearch({
      query: suggestion.query,
      startYear,
      endYear,
    });
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-bar-form">
        <div className="search-term">
          <input
            type="text"
            placeholder="Enter search term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => term && setShowSuggestions(true)}
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span>{suggestion.query}</span>
                  <span className="suggestion-date">
                    {new Date(suggestion.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="year-range">
          <input
            type="text"
            placeholder="Enter Start Year"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter End Year"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
          />
        </div>

        <button type="submit">search</button>
        {error && <div className="search-error">{error}</div>}
      </form>
    </div>
  );
}

export default SearchBar;
