'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { getUserLocation } from '../maps';

interface SearchFormProps {
  className?: string;
}

export default function SearchForm({ className = '' }: SearchFormProps) {
  const { 
    searchProvidersByLocation, 
    searchServicesByKeyword, 
    categories,
    searchFilters,
    loading 
  } = useSearch();
  
  const [keyword, setKeyword] = useState(searchFilters.keyword || '');
  const [selectedCategory, setSelectedCategory] = useState(searchFilters.category || '');
  const [radius, setRadius] = useState(searchFilters.radius || 10);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLocation, setCustomLocation] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Handle search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (keyword) {
      // If keyword is provided, search by keyword
      await searchServicesByKeyword(keyword);
    } else {
      // Otherwise search by location
      try {
        if (useCurrentLocation) {
          // Use browser geolocation
          const location = await getUserLocation();
          await searchProvidersByLocation(
            location.lat,
            location.lng,
            radius,
            selectedCategory || null
          );
        } else if (customLocation) {
          // Use custom location (would need geocoding in a real app)
          // For now, use a default location
          await searchProvidersByLocation(
            40.7128, // New York City coordinates as fallback
            -74.0060,
            radius,
            selectedCategory || null
          );
        } else {
          setLocationError('Please enter a location or use your current location');
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please allow location access or enter a location manually.');
      }
    }
  };

  // Handle location toggle
  const handleLocationToggle = (useCurrentLoc: boolean) => {
    setUseCurrentLocation(useCurrentLoc);
    setLocationError(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="search-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search by
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="search-type"
                checked={!keyword}
                onChange={() => setKeyword('')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Location</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="search-type"
                checked={!!keyword}
                onChange={() => setKeyword(' ')}
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Service</span>
            </label>
          </div>
        </div>

        {keyword ? (
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service or provider name
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Hair styling, nail salon, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <div className="flex space-x-4 mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="location-type"
                    checked={useCurrentLocation}
                    onChange={() => handleLocationToggle(true)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Use my current location</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="location-type"
                    checked={!useCurrentLocation}
                    onChange={() => handleLocationToggle(false)}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Enter location</span>
                </label>
              </div>
              
              {!useCurrentLocation && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Enter city, address, or zip code"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              )}
              
              {locationError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{locationError}</p>
              )}
            </div>

            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search radius: {radius} miles
              </label>
              <input
                type="range"
                id="radius"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
}

