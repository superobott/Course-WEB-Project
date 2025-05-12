import React, { useState } from 'react';

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
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '10px', 
        marginTop: '10px' 
      }}
    >
      <input
        type="text"
        placeholder="enter search term"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button type="submit">search</button>
    </form>
  );
}

export default SearchBar;
