/**
 * Booking API service for handling booking-related API calls
 */

import apiClient from './apiClient';

export interface Booking {
  id: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  platformFee: number;
  notes?: string;
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
  provider: {
    id: number;
    businessName: string;
    user: {
      firstName: string;
      lastName: string;
      profilePhoto: string;
    };
  };
}

export interface BookingCreateParams {
  providerId: number;
  serviceId: number;
  date: string;
  time: string;
  notes?: string;
}

const bookingService = {
  /**
   * Create a new booking
   * @param params - Booking parameters
   */
  async createBooking(params: BookingCreateParams): Promise<{
    success: boolean;
    bookingId: number;
    totalAmount: number;
    platformFee: number;
    paymentUrl: string;
  }> {
    return apiClient.post('/bookings', params, true);
  },

  /**
   * Get user's bookings
   * @param status - Filter by status (upcoming, completed, cancelled)
   * @param page - Page number for pagination
   * @param limit - Results per page
   */
  async getUserBookings(
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get('/bookings', { status, page, limit }, true);
  },

  /**
   * Get booking details by ID
   * @param id - Booking ID
   */
  async getBookingById(id: number): Promise<Booking> {
    return apiClient.get(`/bookings/${id}`, {}, true);
  },

  /**
   * Cancel a booking
   * @param id - Booking ID
   */
  async cancelBooking(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/bookings/${id}/cancel`, {}, true);
  },

  /**
   * Reschedule a booking
   * @param id - Booking ID
   * @param date - New date in YYYY-MM-DD format
   * @param time - New time in HH:MM format
   */
  async rescheduleBooking(
    id: number,
    date: string,
    time: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/bookings/${id}/reschedule`, { date, time }, true);
  }
};

export default bookingService;
