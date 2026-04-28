import axios from 'axios';

// In production (Railway/Vercel), set VITE_API_URL to your backend Railway URL.
// Locally, it falls back to http://localhost:8001/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8765/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
