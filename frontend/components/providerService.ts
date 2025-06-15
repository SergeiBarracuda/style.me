/**
 * Provider API service for handling provider-related API calls
 */

import apiClient from './apiClient';

export interface Provider {
  id: number;
  businessName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  reviewCount: number;
  distance?: number;
  user: {
    firstName: string;
    lastName: string;
    profilePhoto: string;
  };
  services: Array<{
    id: number;
    name: string;
    price: number;
    duration: number;
  }>;
  availableTimes?: string[];
}

export interface ProviderSearchParams {
  location?: string; // Format: "latitude,longitude"
  distance?: number; // Search radius in km
  category?: string;
  rating?: number;
  price?: string; // Format: "min-max"
  availableNow?: boolean;
  page?: number;
  limit?: number;
}

const providerService = {
  /**
   * Search for providers based on various criteria
   * @param params - Search parameters
   */
  async searchProviders(params: ProviderSearchParams): Promise<{
    providers: Provider[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get('/providers', params);
  },

  /**
   * Get provider details by ID
   * @param id - Provider ID
   */
  async getProviderById(id: number): Promise<Provider> {
    return apiClient.get(`/providers/${id}`);
  },

  /**
   * Get available times for a provider on a specific date
   * @param id - Provider ID
   * @param date - Date in YYYY-MM-DD format
   */
  async getProviderAvailability(id: number, date: string): Promise<string[]> {
    return apiClient.get(`/providers/${id}/availability`, { date });
  },

  /**
   * Get nearby providers based on location
   * @param latitude - User's latitude
   * @param longitude - User's longitude
   * @param distance - Search radius in km (default: 10)
   */
  async getNearbyProviders(
    latitude: number,
    longitude: number,
    distance: number = 10
  ): Promise<Provider[]> {
    return apiClient.get('/providers', {
      location: `${latitude},${longitude}`,
      distance,
    }).then(response => response.providers);
  },

  /**
   * Get featured providers
   * @param limit - Number of providers to return (default: 5)
   */
  async getFeaturedProviders(limit: number = 5): Promise<Provider[]> {
    return apiClient.get('/providers/featured', { limit })
      .then(response => response.providers);
  }
};

export default providerService;
