import React, { useState } from 'react';
import './searchBar.css'; 

function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="search-bar-form" 
    >
      <input
        type="text"
        placeholder="Enter search term" 
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button type="submit">search</button> {}
    </form>
  );
}

export default SearchBar;