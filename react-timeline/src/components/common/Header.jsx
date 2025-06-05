import { useNavigate } from 'react-router-dom';
import ProfileIcon from './ProfileIcon';
import '../../style/componentsStyle/Header.css';
import '../../style/componentsStyle/LogoutButton.css';

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userEmail');

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
    <div className="header-wrapper">
      <header className="header">
        <div className="header-left">
          <ProfileIcon />
        </div>
        <div className="header-center">
          Welcome to HistoryFlow
        </div>
        <div className="header-right">
          <div className="logout-button-container">
            {isLoggedIn && (
              <button 
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
