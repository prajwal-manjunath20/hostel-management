// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap standardized envelope: { success, data, meta, message } → response.data = data
// This lets every page read res.data as a raw array/object, as before.
// Error responses (4xx/5xx) are NOT unwrapped — they remain as { success: false, error: { code, message } }
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Network down / backend unreachable
    if (!error.response) {
      return Promise.reject(
        new Error('Cannot reach the server. Please check your connection.')
      );
    }
    // Expired / invalid token — auto logout
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
