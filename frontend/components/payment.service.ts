import api from './api';

// Payment service for handling payment operations
class PaymentService {
  // Create payment intent
  async createPaymentIntent(bookingId) {
    try {
      const response = await api.post('/payments/create-intent', { bookingId });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create payment intent');
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, bookingId) {
    try {
      const response = await api.post('/payments/confirm', { paymentIntentId, bookingId });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to confirm payment');
    }
  }

  // Process refund
  async processRefund(bookingId, reason) {
    try {
      const response = await api.post('/payments/refund', { bookingId, reason });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to process refund');
    }
  }

  // Get payment by booking ID
  async getPaymentByBookingId(bookingId) {
    try {
      const response = await api.get(`/payments/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get payment');
    }
  }

  // Get client payments
  async getClientPayments() {
    try {
      const response = await api.get('/payments/client');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get payments');
    }
  }

  // Get provider payments
  async getProviderPayments() {
    try {
      const response = await api.get('/payments/provider');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get payments');
    }
  }
}

export default new PaymentService();
