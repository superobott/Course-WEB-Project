import '../style/Loading.css';

export default function Loading({ query }) {
  return (
    <>
      <p className="search-query-display">
        {`Searching for: `}
        <span className="query-text">{query}</span>
      </p>
      <p className="loading-message">Loading timeline...</p>
    </>
  );
}