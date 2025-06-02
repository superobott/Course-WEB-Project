import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../logic/Header';
import Footer from '../logic/Footer';
import '../style/index.css';

const Index = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };
  return (
    <div className="index-container">
      <Header />
      <div className="index-content">
        <h1 className="app-title">Welcome to HistoryFlow</h1>
        
        <div className="index-buttons-container">
          <button 
            onClick={handleLoginClick}
            className="index-bubble-button primary"
          >
            Login
          </button>

          <button 
            onClick={handleRegisterClick}
            className="index-bubble-button secondary"
          >
            Register
          </button>
        </div>

        <div className="index-description">
          <p>Discover historical events and timelines through our interactive search platform.</p>
          <p>Login to access your personalized timeline searches or register to get started!</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Index;
