import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // adjust if needed
  withCredentials: true,
});

export default API;
