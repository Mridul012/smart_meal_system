import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://smart-meal-system-6ha3.onrender.com';

const api = axios.create({
  baseURL: `${baseURL}/api`,
});

// auto-attach token so every page doesn't have to do it manually
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
