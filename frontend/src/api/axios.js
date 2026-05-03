import axios from 'axios';

const PRODUCTION_API = 'https://solarji-backend.onrender.com/api';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL
    || (import.meta.env.PROD ? PRODUCTION_API : 'http://localhost:5000/api'),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('solarji_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('solarji_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
