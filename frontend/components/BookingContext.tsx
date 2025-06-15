'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import bookingService from '../services/booking.service';
import { useAuth } from './AuthContext';

// Create booking context
const BookingContext = createContext(null);

// Booking provider component
export const BookingProvider = ({ children }) => {
  const { user } = useAuth();
  const [clientBookings, setClientBookings] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        const providerData = await bookingService.getProviderBookings();
        setProviderBookings(providerData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create booking
  const createBooking = async (bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await bookingService.createBooking(bookingData);
      setCurrentBooking(result.booking);
      
      // Refresh bookings
      await loadBookings();
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get booking by ID
  const getBookingById = async (bookingId) => {
    setLoading(true);
    setError(null);
    
    try {
      const booking = await bookingService.getBookingById(bookingId);
      setCurrentBooking(booking);
      return booking;
    } catch (err) {
      setError(err.message || 'Failed to get booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
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
    } catch (err) {
      setError(err.message || 'Failed to update booking status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId, cancellationReason) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await bookingService.cancelBooking(bookingId, cancellationReason);
      
      // Update current booking if it's the one being cancelled
      if (currentBooking && currentBooking._id === bookingId) {
        setCurrentBooking(result);
      }
      
      // Refresh bookings
      await loadBookings();
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reschedule booking
  const rescheduleBooking = async (bookingId, dateTime) => {
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
    } catch (err) {
      setError(err.message || 'Failed to reschedule booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
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
    refreshBookings: loadBookings
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
