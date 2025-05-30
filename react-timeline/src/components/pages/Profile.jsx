import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../logic/Header';
import '../style/Profile.css';

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
  const [searches, setSearches] = useState([]);
  // Add this useEffect to fetch searches
useEffect(() => {
  const fetchSearches = async () => {
    try {
      console.log('Fetching searches...'); // Debug log
      // Update the endpoint to match the timeline route
      const response = await fetch('http://localhost:4000/api/timeline/searches');
      
      if (!response.ok) {
        console.error('Server response:', response.status);
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Raw search data:', data); // Debug log
      
      // Update how we handle the data based on the response structure
      if (data) {
        setSearches(Array.isArray(data) ? data : [data]);
        console.log('Searches set:', Array.isArray(data) ? data.length : 1, 'items');
      } else {
        console.error('No data received from server');
        setSearches([]);
      }
    } catch (err) {
      console.error('Error fetching searches:', err);
      setSearches([]);
    }
  };

  fetchSearches();
}, []);
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
      // Reset password fields
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
        <Header />
        <div className="profile-container">
          <div className="error-message">
            Please log in to view your profile
            <button onClick={() => navigate('/login')} className="login-button">
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        {/* Add return button here, before the title */}
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
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Edit Profile
            </button>
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
      </div>
            <div className="search-history">
            <h3>Search History ({searches.length})</h3> {/* Added count */}
            {!searches || searches.length === 0 ? (
            <p>No searches yet</p>
            ) : (
            <div className="search-list">
                {searches.map((search) => (
                <div key={search._id} className="search-item">
                    <h4>Search Query: {search.query || 'No query'}</h4>
                    <p className="search-text">{search.fullText || 'No text available'}</p>
                    <p className="search-date">
                    Searched on: {new Date(search.createdAt).toLocaleString()}
                    </p>
                </div>
                ))}
            </div>
            )}
        </div>
    </>
    );
};



export default Profile;