import api from './api';

// Auth service for handling authentication operations
class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Registration failed');
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Login failed');
    }
  }

  // Social login/register
  async socialAuth(userData) {
    try {
      const response = await api.post('/auth/social', userData);
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Social authentication failed');
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      this.setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get user');
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to send reset email');
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to reset password');
    }
  }

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set user in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get user from localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
