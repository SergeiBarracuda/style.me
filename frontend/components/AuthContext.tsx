'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from './auth.service';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already logged in
        if (authService.isAuthenticated()) {
          const userData = authService.getUser();
          setUser(userData);
          
          // Verify token is still valid by fetching current user
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (err) {
            // Token is invalid, log out
            authService.logout();
            setUser(null);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Social login function
  const socialLogin = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.socialAuth(userData);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Social login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
    authService.setUser(userData);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    socialLogin,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
