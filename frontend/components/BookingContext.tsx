'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import bookingService from './booking.service';
import { useAuth } from './AuthContext';
import { Booking, BookingData, BookingStatus, BookingContextType } from '../types/booking.types';

// Create booking context
const BookingContext = createContext<BookingContextType | null>(null);

// Booking provider component
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [providerBookings, setProviderBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookings when user changes
  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setClientBookings([]);
      setProviderBookings([]);
    }
  }, [user]);

  // Load bookings based on user role
  const loadBookings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load client bookings for all users
      const clientData = await bookingService.getClientBookings();
      setClientBookings(clientData);

      // Load provider bookings if user is a provider
      if (user.role === 'provider') {
        const providerData = await bookingService.getProviderBookings();        setProviderBookings(providerData);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookings');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create booking
  const createBooking = async (bookingData: BookingData): Promise<Booking> => {
    setLoading(true);
    setError(null);

    try {
      const result = await bookingService.createBooking(bookingData);
      setCurrentBooking(result);

      // Refresh bookings
      await loadBookings();
      return result;
    } catch (err: any) {
      setError(err?.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get booking by ID
  const getBookingById = async (bookingId: string): Promise<Booking> => {
    setLoading(true);
    setError(null);

    try {
      const booking = await bookingService.getBookingById(bookingId);
      setCurrentBooking(booking);
      return booking;
    } catch (err: any) {
      setError(err?.message || 'Failed to get booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: BookingStatus): Promise<Booking> => {
    setLoading(true);
    setError(null);

    try {
      const result = await bookingService.updateBookingStatus(bookingId, status);

      // Update current booking if it's the one being updated
      if (currentBooking && currentBooking._id === bookingId) {
        setCurrentBooking(result);
      }

      // Refresh bookings
      await loadBookings();

      return result;
    } catch (err: any) {
      setError(err?.message || 'Failed to update booking status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string, cancellationReason?: string): Promise<Booking> => {
    setLoading(true);
    setError(null);

    try {
      const result = await bookingService.cancelBooking(bookingId, cancellationReason);

      // Update current booking if it's the one being cancelled
      if (currentBooking && currentBooking._id === bookingId) {        setCurrentBooking(result);
      }

      // Refresh bookings
      await loadBookings();

      return result;
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reschedule booking
  const rescheduleBooking = async (bookingId: string, dateTime: string): Promise<Booking> => {
    setLoading(true);
    setError(null);

    try {
      const result = await bookingService.rescheduleBooking(bookingId, dateTime);

      // Update current booking if it's the one being rescheduled
      if (currentBooking && currentBooking._id === bookingId) {
        setCurrentBooking(result);
      }

      // Refresh bookings
      await loadBookings();

      return result;
    } catch (err: any) {
      setError(err?.message || 'Failed to reschedule booking');
      throw err;
    } finally {
      setLoading(false);
    }  };

  // Load client bookings specifically
  const loadClientBookings = async (): Promise<void> => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const clientData = await bookingService.getClientBookings();
      setClientBookings(clientData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client bookings');
    } finally {
      setLoading(false);
    }
  };

  // Load provider bookings specifically
  const loadProviderBookings = async (): Promise<void> => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const providerData = await bookingService.getProviderBookings();
      setProviderBookings(providerData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load provider bookings');
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: BookingContextType = {
    clientBookings,
    providerBookings,
    currentBooking,
    loading,
    error,
    createBooking,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    rescheduleBooking,
    loadClientBookings,
    loadProviderBookings
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

// Custom hook to use booking context
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
