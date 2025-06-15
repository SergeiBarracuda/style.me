'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';

interface SearchFiltersProps {
  className?: string;
}

interface PriceRange {
  min: number;
  max: number;
}

export default function SearchFilters({ className = '' }: SearchFiltersProps) {
  const { 
    searchFilters, 
    searchProvidersByLocation,
    loading,
    categories
  } = useSearch();
  
  // Filter states
  const [category, setCategory] = useState(searchFilters.category || '');
  const [rating, setRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 500 });
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('distance');
  
  // Track if filters have changed
  const [filtersChanged, setFiltersChanged] = useState<boolean>(false);

  // Update filtersChanged when any filter changes
  useEffect(() => {
    const hasChanged = 
      category !== searchFilters.category ||
      availableNow !== false || // Assuming default is false
      rating > 0;
    
    setFiltersChanged(hasChanged);
  }, [category, rating, priceRange, availableNow, sortBy, searchFilters]);

  // Apply filters
  const applyFilters = async () => {
    if (searchFilters.location) {
      await searchProvidersByLocation(
        searchFilters.location.lat,
        searchFilters.location.lng,
        searchFilters.radius,
        category || null,
        // Additional parameters could be added to the API
        // These would need to be implemented in the backend
        {
          rating: rating > 0 ? rating : undefined,
          priceMin: priceRange.min > 0 ? priceRange.min : undefined,
          priceMax: priceRange.max < 500 ? priceRange.max : undefined,
          availableNow: availableNow || undefined,
          sortBy: sortBy
        }
      );
    }
  };

  // Reset filters
  const resetFilters = () => {
    setCategory('');
    setRating(0);
    setPriceRange({ min: 0, max: 500 });
    setAvailableNow(false);
    setSortBy('distance');
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Reset all
        </button>
      </div>

      <div className="space-y-4">
        {/* Category filter */}
        <div>
          <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Rating filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Rating
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star === rating ? 0 : star)}
                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {rating}+ stars
              </span>
            )}
          </div>
        </div>

        {/* Price range filter */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price Range
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ${priceRange.min} - ${priceRange.max === 500 ? '500+' : priceRange.max}
            </span>
          </div>
          <div className="relative pt-5 pb-2">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="absolute h-1 bg-blue-500 rounded-full"
                style={{
                  left: `${(priceRange.min / 500) * 100}%`,
                  right: `${100 - (priceRange.max / 500) * 100}%`
                }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              value={priceRange.min}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value < priceRange.max) {
                  setPriceRange({ ...priceRange, min: value });
                }
              }}
              className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
            />
            <input
              type="range"
              min="0"
              max="500"
              value={priceRange.max}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > priceRange.min) {
                  setPriceRange({ ...priceRange, max: value });
                }
              }}
              className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
            />
            <div className="relative">
              <div
                className="absolute w-4 h-4 bg-blue-500 rounded-full -mt-1.5 -ml-2"
                style={{ left: `${(priceRange.min / 500) * 100}%` }}
              ></div>
              <div
                className="absolute w-4 h-4 bg-blue-500 rounded-full -mt-1.5 -ml-2"
                style={{ left: `${(priceRange.max / 500) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Available now filter */}
        <div className="flex items-center">
          <input
            id="available-now"
            type="checkbox"
            checked={availableNow}
            onChange={(e) => setAvailableNow(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="available-now" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Available now
          </label>
        </div>

        {/* Sort by */}
        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        {/* Apply filters button */}
        <div className="pt-2">
          <button
            onClick={applyFilters}
            disabled={loading || !filtersChanged}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}

