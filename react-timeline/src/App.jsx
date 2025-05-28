import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import SearchBar from './components/searchBar';
import TimelineEvent from './components/TimelineEvent';
import Header from './components/Header';
import Footer from './components/Footer';
import TimelineImages from './components/TimelineImages';
import './App.css'; 

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Main App content
const AppContent = () => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState('');
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    if (!query) {
      setFullText('');
      setTimelineEvents([]);
      setImages([]);
      setSource('');
      setError(null);
      return;
    }

    const fetchTimelineData = async () => {
      setLoading(true);
      setError(null);
      setFullText('');
      setTimelineEvents([]);
      setImages([]);
      setSource('');

      try {
        const response = await fetch(`http://localhost:4000/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Something went wrong on the server.');
        }

        const data = await response.json();
        console.log('Data received from server:', data);

        setFullText(data.extract);
        setTimelineEvents(data.timelineEvents);
        setImages(data.images || []);
        setSource(data.source);

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
  }, [query]);

  const getSideImages = (side) => {
    const filteredImages = images.filter(img => img && img.src)
    if (filteredImages.length === 0) return [];
    const half = Math.ceil(filteredImages.length / 2);
    if (side === 'left') {
      return filteredImages.slice(0, half);
    } else {
      return filteredImages.slice(half);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">History Flow</h1>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Welcome, {user.username}!</span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Navigate to="/login" />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Header />
        <h1 className="app-title">Timeline Search</h1>

        <SearchBar onSearch={setQuery} />

        {query && (
          <p className="search-query-display">
            {`Searching for: `}
            <span className="query-text">{query}</span>
          </p>
        )}

        {loading && (
          <p className="loading-message">Loading timeline...</p>
        )}

        {error && (
          <div className="error-box">
            <p className="error-title">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && query && (
          <div className="app-content-wrapper"> 
            {images && images.length > 0 && ( 
              <div className="timeline-images-left">
                <TimelineImages images={getSideImages('left')} />
              </div>
            )}

            {fullText ? (
              <div className="results-container">
                <h2 className="results-title">
                  {`Results for "${query}" `}
                  {source && <span className="source-text">({source})</span>}
                </h2>
                <details className="full-text-details">
                  <summary className="full-text-summary">Show Wikipedia summary</summary>
                  <p className="full-text-display">{fullText}</p>
                </details>

                {timelineEvents.length > 0 ? (
                  <div className="timeline-events-container">
                    {timelineEvents.map((event, index) => (
                      <TimelineEvent
                        key={index}
                        date={event.date}
                        summary={event.summary}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="no-events-message">
                    No specific timeline events found for "{query}" in the extract.
                  </p>
                )}
              </div>
            ) : (
              <p className="no-data-message">
                No data found on Wikipedia for "{query}". Please try a different search term.
              </p>
            )}

            {/* Right Column for Images */}
            {images && images.length > 0 && ( // Explicit check for images array and its length
              <div className="timeline-images-right">
                <TimelineImages images={getSideImages('right')} />
              </div>
            )}
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;