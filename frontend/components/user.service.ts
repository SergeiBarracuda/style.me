import api from './api';

// User service for handling user operations
class UserService {
  // Get user profile
  async getUserProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get user profile');
    }
  }

  // Update user profile
  async updateUserProfile(userData) {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update user profile');
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get user');
    }
  }

  // Add provider to favorites
  async addToFavorites(providerId) {
    try {
      const response = await api.post('/users/favorites', { providerId });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to add to favorites');
    }
  }

  // Remove provider from favorites
  async removeFromFavorites(providerId) {
    try {
      const response = await api.delete(`/users/favorites/${providerId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to remove from favorites');
    }
  }

  // Get user favorites
  async getUserFavorites() {
    try {
      const response = await api.get('/users/favorites');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get favorites');
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences) {
    try {
      const response = await api.put('/users/preferences', { preferences });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update preferences');
    }
  }

  // Upload verification document
  async uploadVerification(documentUrl) {
    try {
      const response = await api.post('/users/verification', { documentUrl });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to upload verification');
    }
  }
}

export default new UserService();
