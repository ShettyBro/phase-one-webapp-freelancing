import axios from 'axios';
import { getToken, clearSession } from './auth';

// Frontend deploys to Vercel; the backend (Netlify Functions) deploys separately.
// In production set VITE_API_BASE_URL to the Netlify site's API URL, e.g.
//   https://<your-site>.netlify.app/api
// Locally (netlify dev) it falls back to the relative '/api'.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
      // Redirect to login only when inside an admin route — don't disrupt public pages.
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/admin/login')) {
        window.location.replace('/admin/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
