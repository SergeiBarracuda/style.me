import api from './api';

// Type definitions
interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  address?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  address?: string;
  isVerified: boolean;
  preferences?: any;
}

interface Provider {
  id: string;
  businessName: string;
  user: User;
  averageRating: number;
  reviewCount: number;
}

// User service for handling user operations
class UserService {
  // Get user profile
  async getUserProfile(): Promise<User> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get user profile');
    }
  }

  // Update user profile
  async updateUserProfile(userData: UserData): Promise<User> {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update user profile');
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get user');
    }
  }

  // Add provider to favorites
  async addToFavorites(providerId: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/users/favorites', { providerId });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to add to favorites');
    }
  }

  // Remove provider from favorites
  async removeFromFavorites(providerId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/users/favorites/${providerId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to remove from favorites');
    }
  }

  // Get user favorites
  async getUserFavorites(): Promise<Provider[]> {
    try {
      const response = await api.get('/users/favorites');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get favorites');
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences: any): Promise<User> {
    try {
      const response = await api.put('/users/preferences', { preferences });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update preferences');
    }
  }

  // Upload verification document
  async uploadVerification(documentUrl: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/users/verification', { documentUrl });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to upload verification');
    }
  }
}

export default new UserService();
