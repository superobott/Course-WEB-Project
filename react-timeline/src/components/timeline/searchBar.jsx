import React, { useState } from 'react';
import '../../style/componentsStyle/searchBar.css';

function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) return;
    
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
            onChange={(e) => setTerm(e.target.value)}
          />
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
