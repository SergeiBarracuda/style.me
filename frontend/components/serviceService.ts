/**
 * Service API service for handling service-related API calls
 */

import apiClient from './apiClient';

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  providerId: number;
}

export interface ServiceSearchParams {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  providerId?: number;
  page?: number;
  limit?: number;
}

const serviceService = {
  /**
   * Search for services based on various criteria
   * @param params - Search parameters
   */
  async searchServices(params: ServiceSearchParams): Promise<{
    services: Service[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get('/services', params);
  },

  /**
   * Get service details by ID
   * @param id - Service ID
   */
  async getServiceById(id: number): Promise<Service> {
    return apiClient.get(`/services/${id}`);
  },

  /**
   * Get services for a specific provider
   * @param providerId - Provider ID
   */
  async getProviderServices(providerId: number): Promise<Service[]> {
    return apiClient.get('/services', { providerId })
      .then(response => response.services);
  },

  /**
   * Get popular service categories
   * @param limit - Number of categories to return (default: 10)
   */
  async getPopularCategories(limit: number = 10): Promise<string[]> {
    return apiClient.get('/services/categories/popular', { limit });
  }
};

export default serviceService;
