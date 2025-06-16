import api from './api';

// Search service for handling search operations
class SearchService {  // Search providers by location
  async searchProvidersByLocation(lat, lng, radius = 10, category = null) {
    try {
      const params: any = { lat, lng, radius };
      if (category) params.category = category;

      const response = await api.get('/search/providers', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to search providers');
    }
  }

  // Search services by keyword
  async searchServicesByKeyword(keyword) {
    try {
      const response = await api.get('/search/services', { params: { keyword } });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to search services');
    }
  }

  // Get featured providers
  async getFeaturedProviders() {
    try {
      const response = await api.get('/search/featured-providers');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get featured providers');
    }
  }

  // Get popular services
  async getPopularServices() {
    try {
      const response = await api.get('/search/popular-services');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get popular services');
    }
  }

  // Get service categories
  async getServiceCategories() {
    try {
      const response = await api.get('/search/categories');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get service categories');
    }
  }
}

export default new SearchService();
