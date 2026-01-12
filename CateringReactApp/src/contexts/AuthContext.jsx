import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../services/api';
import { getToken, removeToken, setToken } from '../services/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await auth.login(credentials);
      if (response.data && response.data.token) {
        setToken(response.data.token);
        setIsAuthenticated(true);
        toast.success('Successfully logged in');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        return response;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      removeToken();
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
    toast.success('Successfully logged out');
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};