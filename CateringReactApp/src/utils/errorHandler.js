import toast from 'react-hot-toast';

export const handleApiError = (error) => {
  const message = error.response?.data?.message || 'An error occurred';
  toast.error(message);
  return message;
};

export const isAuthError = (error) => {
  return error.response?.status === 401;
};