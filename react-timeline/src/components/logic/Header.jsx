import { useNavigate } from 'react-router-dom';
import '../style/Header.css';

function Header() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header flex justify-between items-center px-8">
      <div className="text-3xl font-bold">Welcome to HistoryFlow</div>
      <div className="text-2xl">
        <button 
          onClick={handleProfileClick}
          className="profile-button"
        >
          <i className="fas fa-user" /> Profile
        </button>
      </div>
    </header>
  );
}

export default Header;