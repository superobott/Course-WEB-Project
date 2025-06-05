import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import '../style/pagestyle/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const [isEditing, setIsEditing] = useState(false);  
  const [formData, setFormData] = useState({
    email: userEmail,
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchError, setSearchError] = useState('');
  
  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        if (!userId) return;
        
        const response = await fetch(`http://localhost:4000/api/users/search-history/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch search history');
        }
        
        const data = await response.json();
        setSearchHistory(data);
      } catch (err) {
        console.error('Error fetching search history:', err);
        setSearchError('Failed to load search history');
      }
    };

    fetchSearchHistory();
  }, [userId]);

  const handleDeleteSearch = async (searchId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/search-history/${userId}/${searchId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete search');
      }

      setSearchHistory(prev => prev.filter(item => item.searchId._id !== searchId));
    } catch (err) {
      console.error('Error deleting search:', err);
      setSearchError('Failed to delete search');
    }
  };

  const handleRerunSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Only validate new password if provided
  if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
    setError('New passwords do not match');
    return;
  }

  try {
    const response = await fetch(`http://localhost:4000/api/users/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.newPassword // Changed from newPassword to password
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('userEmail', formData.email);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      setError(data.message || 'Update failed');
    }
  } catch (err) {
    console.error('Update error:', err);
    setError('Error connecting to server');
  }
};

  if (!userEmail) {
    return (
      <>
       <div className="profile-main-container">
        <Header />
        <div className="profile-container">
          <div className="error-message">
            Please log in to view your profile
            <button onClick={() => navigate('/login')} className="login-button">
              Go to Login
            </button>
          </div>
        </div>
        <Footer /> 
        </div>
      </>
    );
  }

  return (
    <>
    <div className="profile-main-container">
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <button onClick={() => navigate('/search')} className="return-button">
            Return to Search
          </button>
          <h2>My Profile</h2>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}
        {!isEditing ? (
          <>
            <div className="profile-info">
              <div className="info-item">
                <label>Email:</label>
                <span>{userEmail}</span>
              </div>
              <div className="info-item">
                <label>Password:</label>
                <span>********</span>
              </div>
            </div>
            <div className="buttons">
            
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Edit Profile
            </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
                <label>Email:</label>
                <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                />
            </div>
            <div className="form-group">
                <label>New Password:</label>
                <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                />
            </div>
            <div className="form-group">
                <label>Confirm New Password:</label>
                <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                />
            </div>
            <div className="button-group">
                <button type="submit" className="save-button">Save Changes</button>
                <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="cancel-button"
                >
                Cancel
                </button>
            </div>
            </form>

        )}
        <div className="search-history">
          <h3>Search History ({searchHistory.length})</h3>
          {searchError && <div className="error-message">{searchError}</div>}
          {!searchHistory || searchHistory.length === 0 ? (
            <p>No searches yet</p>
          ) : (
            <div className="search-list">
              {searchHistory.map((historyItem) => (
                <div key={historyItem.searchId._id} className="search-item">
                  <div className="search-item-header">
                    <h4>Search Query: {historyItem.query}</h4>
                    <div className="search-actions">
                      <button 
                        onClick={() => handleRerunSearch(historyItem.query)}
                        className="rerun-button"
                      >
                        Re-run Search
                      </button>
                      <button 
                        onClick={() => handleDeleteSearch(historyItem.searchId._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="search-date">
                    Searched on: {new Date(historyItem.createdAt).toLocaleString()}
                  </p>
                  <div className="search-metadata">
                    <p>Timeline Events: {historyItem.searchId.timelineEvents.length}</p>
                    <p>Images: {historyItem.searchId.images.length}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />      
      </div>
    </>
    );
};


export default Profile;
