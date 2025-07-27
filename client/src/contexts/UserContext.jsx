import React, { createContext, useEffect, useState } from 'react';
import {jwtDecode} from 'jwt-decode';
import axios from '../components/api';

export const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-load user and token from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 < Date.now()) {
          logout(); // Token expired
        } else {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.error("Invalid token", err);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
  try {
    const { data } = await axios.get("/auth/me", getAuthHeader());
    setUser(data.user); // this must include profileImage!
    // console.log("Refreshed user:", data.user);
  } catch (err) {
    console.error("Failed to refresh user:", err);
  }
};
  // Login handler
  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Auth header utility for axios
  const getAuthHeader = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  return (
    <UserContext.Provider value={{ user, token, login, logout, setUser, getAuthHeader, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;
