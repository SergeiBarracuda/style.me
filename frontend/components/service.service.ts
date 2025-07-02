import api from './api';

// Type definitions
interface ServiceData {
  name: string;
  price: number;
  duration: number;
  description?: string;
  category: string;
  imageUrl?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category: string;
  imageUrl?: string;
  provider: {
    id: string;
    businessName?: string;
    user: {
      firstName: string;
      lastName: string;
    };
    averageRating?: number;
  };
}

// Service service for handling service operations
class ServiceService {
  // Create service
  async createService(serviceData: ServiceData): Promise<Service> {
    try {
      const response = await api.post('/services', serviceData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to create service');
    }
  }

  // Update service
  async updateService(serviceId: string, serviceData: Partial<ServiceData>): Promise<Service> {
    try {
      const response = await api.put(`/services/${serviceId}`, serviceData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update service');
    }
  }

  // Delete service
  async deleteService(serviceId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/services/${serviceId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to delete service');
    }
  }

  // Get service by ID
  async getServiceById(serviceId: string): Promise<Service> {
    try {
      const response = await api.get(`/services/${serviceId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get service');
    }
  }

  // Get services by provider
  async getServicesByProvider(providerId: string): Promise<Service[]> {
    try {
      const response = await api.get(`/services/provider/${providerId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get services');
    }
  }

  // Get services by category
  async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const response = await api.get(`/services/category/${category}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get services');
    }
  }

  // Get current provider's services
  async getCurrentProviderServices(): Promise<Service[]> {
    try {
      const response = await api.get('/services/me');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get services');
    }
  }

  // Get popular categories
  async getPopularCategories(): Promise<string[]> {
    try {
      const response = await api.get('/services/categories/popular');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get popular categories');
    }
  }
}

export default new ServiceService();
