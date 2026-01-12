import axios from 'axios';
import { getToken, removeToken, setToken } from './auth';

export const api = axios.create({
  // Use the environment variable for the base URL
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000, // Increased timeout for file uploads
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Store the current location before redirecting
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectTo', currentPath);
      }
      removeToken();
      window.location.href = '/login';
    }
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }
    return Promise.reject(error);
  }
);

export const bills = {
  getAll: () => api.get('/api/bills'),
  getById: (id) => api.get(`/api/bills/${id}`),
  create: (data) => api.post('/api/bills', data),
  update: (id, data) => api.put(`/api/bills/${id}`),
  delete: (id) => api.delete(`/api/bills/${id}`)
};

export const auth = {
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      if (response.data.token) {
        setToken(response.data.token);
        return response;
      }
      throw new Error('No token received');
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default api;