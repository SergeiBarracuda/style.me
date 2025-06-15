import api from './api';

// Provider service for handling provider operations
class ProviderService {
  // Create provider profile
  async createProviderProfile(profileData) {
    try {
      const response = await api.post('/providers/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create provider profile');
    }
  }

  // Update provider profile
  async updateProviderProfile(profileData) {
    try {
      const response = await api.put('/providers/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update provider profile');
    }
  }

  // Get current provider profile
  async getCurrentProviderProfile() {
    try {
      const response = await api.get('/providers/profile');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get provider profile');
    }
  }

  // Get provider profile by user ID
  async getProviderProfileByUserId(userId) {
    try {
      const response = await api.get(`/providers/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get provider profile');
    }
  }

  // Add portfolio item
  async addPortfolioItem(portfolioItem) {
    try {
      const response = await api.post('/providers/portfolio', portfolioItem);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to add portfolio item');
    }
  }

  // Remove portfolio item
  async removePortfolioItem(itemId) {
    try {
      const response = await api.delete(`/providers/portfolio/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to remove portfolio item');
    }
  }

  // Update availability
  async updateAvailability(availability) {
    try {
      const response = await api.put('/providers/availability', { availability });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update availability');
    }
  }

  // Get provider availability
  async getProviderAvailability(providerId) {
    try {
      const response = await api.get(`/providers/${providerId}/availability`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get availability');
    }
  }

  // Upload verification documents
  async uploadVerificationDocuments(documentUrls) {
    try {
      const response = await api.post('/providers/verification', { documentUrls });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to upload verification documents');
    }
  }
}

export default new ProviderService();
