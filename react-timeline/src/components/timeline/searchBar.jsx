import React, { useState } from 'react';
import '../../style/componentsStyle/searchBar.css';


function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!term.trim()) {
      setError('Please enter a search term.');
      return;
    }
    setError('');
    onSearch({
      query: term,
      startYear,
      endYear,
    });
    setTerm('');        
    setStartYear('');   
    setEndYear('');   
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar-form" >
    
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
  );
}

export default SearchBar;