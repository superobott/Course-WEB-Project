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
    <form onSubmit={handleSubmit} className="flex gap-4 mt-4">
  <input
    type="text"
    placeholder="Enter search term"
    value={term}
    onChange={(e) => setTerm(e.target.value)}
    className="px-4 py-2 rounded-lg text-black w-64 focus:outline-none focus:ring-2 focus:ring-[#00CED1]"
  />
  <button
    type="submit"
    className="bg-[#00CED1] hover:bg-[#00b8ba] text-white px-4 py-2 rounded-lg"
  >
    Search
  </button>
</form>

  );
}

export default SearchBar;
