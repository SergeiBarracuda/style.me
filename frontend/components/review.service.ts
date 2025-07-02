import api from './api';

export interface ReviewData {
  providerId: string;
  rating: number;
  comment?: string;
  bookingId?: string;
}

// Review service for handling review operations
class ReviewService {
  // Create review
  async createReview(reviewData: ReviewData): Promise<any> {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to create review');
    }
  }

  // Get reviews by provider
  async getReviewsByProvider(providerId: string): Promise<any> {
    try {
      const response = await api.get(`/reviews/provider/${providerId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Get reviews by client
  async getReviewsByClient(): Promise<any> {
    try {
      const response = await api.get('/reviews/client');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Get reviews received by provider
  async getReviewsReceivedByProvider(): Promise<any> {
    try {
      const response = await api.get('/reviews/received');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get reviews');
    }
  }

  // Update review
  async updateReview(reviewId: string, reviewData: Partial<ReviewData>): Promise<any> {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update review');
    }
  }

  // Delete review
  async deleteReview(reviewId: string): Promise<any> {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to delete review');
    }
  }
}

export default new ReviewService();
