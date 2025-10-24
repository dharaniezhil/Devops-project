import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import API, { authAPI, adminAPI, labourAPI } from '../services/api';

const AuthContext = createContext();

// API baseURL and interceptors are configured in services/api.js

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
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing authentication on app start
  useEffect(() => {
    let mounted = true;
    
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Optional local check for expiry
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            if (mounted) {
              setLoading(false);
            }
            return;
          }
        } catch (_) {
          // If decode fails, proceed to server validation
        }

        try {
          let response;
          try {
            const decoded = jwtDecode(token);
            if (decoded?.actorType === 'admin') {
              response = await adminAPI.getMe?.();
            } else if (decoded?.actorType === 'labour') {
              response = await labourAPI.getProfile();
            } else {
              response = await authAPI.getMe();
            }
          } catch {
            response = await authAPI.getMe();
          }
          
          if (!mounted) return;
          
          setUser(response.data.user);
          setIsAuthenticated(true);
          console.log('User restored from token:', response.data.user?.email);
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          if (!mounted) return;
          
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error setting up auth check:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = (token, user) => {
    // Persist
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    // State
    setUser(user);
    setIsAuthenticated(true);
    setError('');
  };

  const login = async (credentials) => {
    setLoading(true);
    setError('');
    
    try {
      // Normalize email on client side
      const payload = {
        email: (credentials.email || '').trim().toLowerCase(),
        password: credentials.password || ''
      };
      const response = await authAPI.login(payload);
      
      if (response.status === 200) {
        const { token, user } = response.data;
        authenticate(token, user);
        console.log('Login successful:', user);
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      
      // Remove invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // User registration method (traditional MongoDB registration)
  const register = async (userData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.status === 201) {
        // Registration successful, but don't log in automatically
        // User needs to sign in after registration
        return { success: true, message: 'Registration successful! Please sign in to continue.' };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Remove token from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      setError('');
      
      console.log('User logged out');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    // Traditional auth methods
    login,
    register,
    authenticate,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
