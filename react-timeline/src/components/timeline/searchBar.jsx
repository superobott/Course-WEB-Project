import React, { useState } from 'react';
import '../../style/componentsStyle/searchBar.css';

function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const userId = localStorage.getItem('userId');

  const fetchSuggestions = async (input) => {
    if (!userId || !input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/users/search-history/${userId}`);
      if (response.ok) {
        const searchHistory = await response.json();
        const filteredSuggestions = searchHistory.filter(historyTerm => 
          historyTerm.toLowerCase().startsWith(input.toLowerCase()) &&
          historyTerm.toLowerCase() !== input.toLowerCase()
        );
        setSuggestions(filteredSuggestions);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTerm(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setTerm(suggestion);
    setShowSuggestions(false);
    onSearch({
      query: suggestion,
      startYear: startYear.trim(),
      endYear: endYear.trim()
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    
    setShowSuggestions(false);
    onSearch({
      query: term.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim()
    });
  };

  const validateYear = (value) => {
    return value === '' || /^\d{0,4}$/.test(value);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-bar-form">
        <div className="search-term">
          <input
            type="text"
            placeholder="Enter search term"
            value={term}
            onChange={handleInputChange}
            onFocus={() => term.trim() && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-scroll">
              <div className="suggestions-inner">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="year-range">
          <input
            type="text"
            placeholder="Start Year"
            value={startYear}
            onChange={(e) => validateYear(e.target.value) && setStartYear(e.target.value)}
          />
          <input
            type="text"
            placeholder="End Year"
            value={endYear}
            onChange={(e) => validateYear(e.target.value) && setEndYear(e.target.value)}
          />
        </div>

        <button type="submit">Search</button>
      </form>
    </div>
  );
}

export default SearchBar;
