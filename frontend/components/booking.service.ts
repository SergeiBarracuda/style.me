import api from './api';
import { Booking, BookingData, BookingStatus } from '../types/booking.types';

// Booking service for handling booking operations
class BookingService {
  // Create booking
  async createBooking(bookingData: BookingData): Promise<Booking> {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to create booking');
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get booking');
    }
  }

  // Get client bookings
  async getClientBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings/client');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get bookings');
    }
  }

  // Get provider bookings
  async getProviderBookings(): Promise<Booking[]> {
    try {
      const response = await api.get('/bookings/provider');
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to get bookings');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data;    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to update booking status');
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, cancellationReason?: string): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { cancellationReason });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to cancel booking');
    }
  }

  // Reschedule booking
  async rescheduleBooking(bookingId: string, dateTime: string): Promise<Booking> {
    try {
      const response = await api.put(`/bookings/${bookingId}/reschedule`, { dateTime });
      return response.data;
    } catch (error: any) {
      throw error.response ? error.response.data : new Error('Failed to reschedule booking');
    }
  }
}

export default new BookingService();
