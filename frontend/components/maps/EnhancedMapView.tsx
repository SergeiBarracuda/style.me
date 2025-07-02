'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from 'next-themes';
import EnhancedProviderMap from './EnhancedProviderMap';

export default function EnhancedMapView() {
  const { searchResults, loading, error, searchFilters } = useSearch();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Transform providers to the format expected by ProviderMap
  const mapProviders = searchResults.map(provider => ({
    id: parseInt(provider.id, 10) || 0,
    name: provider.businessName || `${provider.user.firstName} ${provider.user.lastName}`,
    profilePhoto: provider.user.profilePhoto || '/placeholder-profile.jpg',
    primaryService: provider.services && provider.services.length > 0 
      ? provider.services[0].name 
      : 'Service Provider',
    rating: provider.averageRating,
    location: { 
      lat: provider.latitude || (provider.location?.coordinates?.[1] || 0), 
      lng: provider.longitude || (provider.location?.coordinates?.[0] || 0)
    },
    distance: provider.distance ? `${provider.distance.toFixed(1)} miles` : undefined,
    availableTimes: provider.availableTimes,
  }));

  // Calculate map center based on search results or user's search location
  const getMapCenter = () => {
    if (searchResults.length > 0) {
      // Calculate the average of all provider locations
      const totalLat = searchResults.reduce((sum, provider) => 
        sum + (provider.latitude || (provider.location?.coordinates?.[1] || 0)), 0);
      const totalLng = searchResults.reduce((sum, provider) => 
        sum + (provider.longitude || (provider.location?.coordinates?.[0] || 0)), 0);
      
      return {
        lat: totalLat / searchResults.length,
        lng: totalLng / searchResults.length
      };
    } else if (searchFilters.location) {
      // Use the search location
      return searchFilters.location;
    }
    
    // Default to New York City if no results or search location
    return { lat: 40.7128, lng: -74.0060 };
  };

  // Calculate appropriate zoom level based on search radius
  const getZoomLevel = () => {
    if (searchFilters.radius) {
      // Approximate zoom level based on radius
      // Smaller radius = higher zoom level
      if (searchFilters.radius <= 2) return 15;
      if (searchFilters.radius <= 5) return 14;
      if (searchFilters.radius <= 10) return 13;
      if (searchFilters.radius <= 20) return 12;
      if (searchFilters.radius <= 50) return 10;
      return 9;
    }
    return 13; // Default zoom level
  };

  if (loading) {
    return (
      <div className="h-[600px] flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="h-[600px] flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-gray-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">No providers found on the map</p>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-[600px]">
      <EnhancedProviderMap 
        providers={mapProviders} 
        isDarkMode={isDarkMode}
        center={getMapCenter()}
        zoom={getZoomLevel()}
        enableClustering={true}
        showSearchRadius={true}
        searchRadius={searchFilters.radius}
        searchLocation={searchFilters.location}
      />
    </div>
  );
}

