import { useNavigate } from 'react-router-dom';
import '../style/Header.css';

const profileImage = "data:image/svg+xml,%3Csvg width='32' height='32'  viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23e0e0e0'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23757575'/%3E%3Cpath d='M16 19c-5 0-10 2.5-10 5v2h20v-2c0-2.5-5-5-10-5z' fill='%23757575'/%3E%3C/svg%3E";

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
         <img 
            src={profileImage}
            alt="Profile" 
            className="w-8 h-8 rounded-full"
            style={{
              background: 'white',
              border: '1px solid #ccc',
              padding: '2px',
              objectFit: 'cover'
            }}
          />
        </button>
      </div>
    </header>
  );
}

export default Header;