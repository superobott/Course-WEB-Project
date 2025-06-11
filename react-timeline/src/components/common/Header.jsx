import { useNavigate } from 'react-router-dom';
import '../../style/componentsStyle/Header.css';

const profileImage = "data:image/svg+xml,%3Csvg width='32' height='32'  viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23e0e0e0'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23757575'/%3E%3Cpath d='M16 19c-5 0-10 2.5-10 5v2h20v-2c0-2.5-5-5-10-5z' fill='%23757575'/%3E%3C/svg%3E";

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userEmail');

  const handleProfileClick = () => {
    navigate('/profile');
  };
  const handleBubbleClick = () => {
  navigate('/bubble');
  };

  const handleLogout = async () => {
    const email = localStorage.getItem('userEmail');
    console.log('Logging out:', email);
    if (email) {
      await fetch('http://localhost:4000/api/users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      navigate('/');
    }
  };

  return (
    <header className="header">
    <div className="header-center">
        Welcome to HistoryFlow
      </div>
      <div className="header-left">
        <button 
          onClick={handleProfileClick}
          className="profile-button"
        >
          <img 
            src={profileImage}
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
        </button>
        <button 
          onClick={handleBubbleClick}
          className="bubble-nav-button"
          style={{ marginLeft: "12px" }}
        >
          Explore Bubbles
        </button>
      </div>
      <div className="header-right">
        {isLoggedIn && (
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;