import axios from 'axios';

// Production: VITE_API_URL=https://<backend>.onrender.com/api (set in Vercel).
// Local dev: falls back to "/api", which Vite proxies to the Express server.
const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000, // free Render instances can take ~50s to wake up
  headers: { 'Content-Type': 'application/json' }
});

// Attach the JWT saved at login to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid session on a protected call sends the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthForm && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. It may be waking up — try again.';
  if (!err.response) return 'Cannot reach the server. Check your connection or the API URL.';
  return fallback;
}

export default api;
