// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/**
 * Read auth state from localStorage synchronously so the very first render
 * already has the correct user — eliminates the null → redirect race condition
 * that was logging users out on every page refresh.
 */
function getInitialUser() {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      // Restore the Authorization header so API calls work immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return user;
    }
  } catch {
    // Corrupted localStorage — fall through to null
  }
  return null;
}

export function AuthProvider({ children }) {
  // Initialise synchronously — no useEffect, no flash of null
  const [user, setUser] = useState(getInitialUser);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(user);
    return user.role; // Return role for navigation
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
