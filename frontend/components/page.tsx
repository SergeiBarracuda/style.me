'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import providerService, { ProviderSearchParams } from './provider.service';
import serviceService from './service.service';
import { getUserLocation } from './maps';
import MapView from './map-view';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse search parameters
  const initialFilters: ProviderSearchParams = {
    location: searchParams.get('location') || undefined,
    category: searchParams.get('category') || undefined,
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
    price: searchParams.get('price') || undefined,
    availableNow: searchParams.get('availableNow') === 'true',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
  };

  const [filters, setFilters] = useState<ProviderSearchParams>(initialFilters);
  const [view, setView] = useState<'map' | 'list'>(searchParams.get('view') === 'list' ? 'list' : 'map');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const popularCategories = await serviceService.getPopularCategories();
        setCategories(['All Services', ...popularCategories]);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Fallback to basic categories
        setCategories(['All Services', 'Hair', 'Nails', 'Makeup', 'Massage', 'Barber']);
      }
    };

    fetchCategories();
  }, []);

  // Get user location if not provided
  useEffect(() => {
    const getLocation = async () => {
      if (!filters.location) {
        try {
          const userLocation = await getUserLocation();
          setFilters(prev => ({
            ...prev,
            location: `${userLocation.lat},${userLocation.lng}`
          }));
        } catch (err) {
          console.error('Error getting user location:', err);
          // Use default location if user location can't be determined
          setFilters(prev => ({
            ...prev,
            location: '40.7128,-74.0060' // Default to NYC
          }));
        }
      }
      setLoading(false);
    };

    getLocation();
  }, [filters.location]);

  // Update URL when filters change
  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      
      params.set('view', view);
      
      router.push(`/search?${params.toString()}`);
    }
  }, [filters, view, loading, router]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ProviderSearchParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when filters change
      page: key !== 'page' ? 1 : value
    }));
  };

  // Toggle view between map and list
  const toggleView = () => {
    setView(prev => prev === 'map' ? 'list' : 'map');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="md:col-span-3">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Find Beauty Services Near You</h1>
      
      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Type
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category, index) => (
                <option key={index} value={category === 'All Services' ? 'all' : category.toLowerCase()}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Rating
            </label>
            <select
              value={filters.rating || ''}
              onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
          
          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price Range
            </label>
            <select
              value={filters.price || ''}
              onChange={(e) => handleFilterChange('price', e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Price</option>
              <option value="0-25">$0 - $25</option>
              <option value="25-50">$25 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-999">$100+</option>
            </select>
          </div>
          
          {/* Available Now Filter */}
          <div className="flex items-end">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters.availableNow || false}
                onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Available Now</span>
            </label>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-end justify-end">
            <button
              onClick={toggleView}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {view === 'map' ? (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List View
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map View
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Results View */}
      <div className="grid grid-cols-1 gap-6">
        {view === 'map' ? (
          <MapView filters={filters} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            {/* List view implementation would go here */}
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              List view is being implemented. Please use map view for now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
