import axios from 'axios';

// Create a centralized axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', // Fallback to /api for dev proxy if VITE_API_URL is not set
});

export default api;
