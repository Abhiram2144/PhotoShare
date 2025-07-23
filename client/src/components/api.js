import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`, // adjust if needed
  withCredentials: true,
});

export default API;
