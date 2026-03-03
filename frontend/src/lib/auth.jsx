import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiClient.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      apiClient.removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiClient.login(credentials);
      apiClient.setAuthToken(response.token);
      // Fetch full profile to ensure complete user shape
      const full = await apiClient.getProfile();
      setUser(full);
      return { ...response, user: full };
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.register(userData);
      apiClient.setAuthToken(response.token);
      // Fetch full profile to ensure complete user shape
      const full = await apiClient.getProfile();
      setUser(full);
      return { ...response, user: full };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiClient.removeAuthToken();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

