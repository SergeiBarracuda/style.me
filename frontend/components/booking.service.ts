import api from './api';

// Booking service for handling booking operations
class BookingService {
  // Create booking
  async createBooking(bookingData) {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create booking');
    }
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get booking');
    }
  }

  // Get client bookings
  async getClientBookings() {
    try {
      const response = await api.get('/bookings/client');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get bookings');
    }
  }

  // Get provider bookings
  async getProviderBookings() {
    try {
      const response = await api.get('/bookings/provider');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get bookings');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status) {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update booking status');
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, cancellationReason) {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { cancellationReason });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to cancel booking');
    }
  }

  // Reschedule booking
  async rescheduleBooking(bookingId, dateTime) {
    try {
      const response = await api.put(`/bookings/${bookingId}/reschedule`, { dateTime });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to reschedule booking');
    }
  }
}

export default new BookingService();
