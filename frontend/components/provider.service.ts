import api from './api';

export interface ProviderSearchParams {
  location?: string;
  category?: string;
  rating?: number;
  price?: string;
  availableNow?: boolean;
  page?: number;
  limit?: number;
}

export interface ProviderProfileData {
  businessName?: string;
  bio?: string;
  location?: string;
  category?: string;
  services?: string[];
  pricing?: {
    min?: number;
    max?: number;
  };
  availability?: any;
  photos?: string[];
  [key: string]: any;
}

// Provider service for handling provider operations
class ProviderService {
  // Create provider profile
  async createProviderProfile(profileData: ProviderProfileData): Promise<any> {
    try {
      const response = await api.post('/providers/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to create provider profile');
    }
  }

  // Update provider profile
  async updateProviderProfile(profileData: ProviderProfileData): Promise<any> {
    try {
      const response = await api.put('/providers/profile', profileData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update provider profile');
    }
  }

  // Get current provider profile
  async getCurrentProviderProfile(): Promise<any> {
    try {
      const response = await api.get('/providers/profile');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get provider profile');
    }
  }

  // Get provider profile by user ID
  async getProviderProfileByUserId(userId: string): Promise<any> {
    try {
      const response = await api.get(`/providers/user/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get provider profile');
    }
  }

  // Add portfolio item
  async addPortfolioItem(portfolioItem: any): Promise<any> {
    try {
      const response = await api.post('/providers/portfolio', portfolioItem);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to add portfolio item');
    }
  }

  // Remove portfolio item
  async removePortfolioItem(itemId: string): Promise<any> {
    try {
      const response = await api.delete(`/providers/portfolio/${itemId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to remove portfolio item');
    }
  }

  // Update availability
  async updateAvailability(availability: any): Promise<any> {
    try {
      const response = await api.put('/providers/availability', { availability });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update availability');
    }
  }

  // Get provider availability
  async getProviderAvailability(providerId: string): Promise<any> {
    try {
      const response = await api.get(`/providers/${providerId}/availability`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get availability');
    }
  }

  // Upload verification documents
  async uploadVerificationDocuments(documentUrls: string[]): Promise<any> {
    try {
      const response = await api.post('/providers/verification', { documentUrls });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to upload verification documents');
    }
  }
}

export default new ProviderService();
