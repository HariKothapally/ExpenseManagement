import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return {
    isAuthenticated,
    logout
  };
}