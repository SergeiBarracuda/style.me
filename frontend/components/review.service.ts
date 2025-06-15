import api from './api';

// Review service for handling review operations
class ReviewService {
  // Create review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create review');
    }
  }

  // Get reviews by provider
  async getReviewsByProvider(providerId) {
    try {
      const response = await api.get(`/reviews/provider/${providerId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Get reviews by client
  async getReviewsByClient() {
    try {
      const response = await api.get('/reviews/client');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Get reviews received by provider
  async getReviewsReceivedByProvider() {
    try {
      const response = await api.get('/reviews/received');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Update review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update review');
    }
  }

  // Delete review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete review');
    }
  }
}

export default new ReviewService();
