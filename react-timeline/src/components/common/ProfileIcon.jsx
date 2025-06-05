import { useNavigate } from 'react-router-dom';
import '../../style/componentsStyle/ProfileIcon.css';

const profileImage = "data:image/svg+xml,%3Csvg width='32' height='32'  viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23e0e0e0'/%3E%3Ccircle cx='16' cy='12' r='5' fill='%23757575'/%3E%3Cpath d='M16 19c-5 0-10 2.5-10 5v2h20v-2c0-2.5-5-5-10-5z' fill='%23757575'/%3E%3C/svg%3E";

function ProfileIcon() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userEmail');

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!isLoggedIn) return null;

  return (
    <button 
      onClick={handleProfileClick}
      className="profile-icon-button"
    >
      <img 
        src={profileImage}
        alt="Profile" 
        className="profile-icon-image"
      />
    </button>
  );
}

export default ProfileIcon;
