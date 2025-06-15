'use client';

import React from 'react';
import { AuthProvider } from './AuthContext';
import { SearchProvider } from './SearchContext';
import { BookingProvider } from './BookingContext';

// Global app provider that combines all context providers
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SearchProvider>
        <BookingProvider>
          {children}
        </BookingProvider>
      </SearchProvider>
    </AuthProvider>
  );
};
