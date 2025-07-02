'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import searchService from '../components/search.service';

// Define types
interface Location {
  lat: number;
  lng: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category: string;
}

interface Provider {
  id: string;
  businessName: string;
  averageRating: number;
  reviewCount?: number;
  verified?: boolean;
  services: Service[];
  user: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  latitude?: number;
  longitude?: number;
  location?: {
    coordinates?: [number, number];
  };
  distance?: number;
  availableTimes?: string[];
}

interface SearchFilters {
  location: Location | null;
  category: string | null;
  keyword: string;
  radius: number;
  rating?: number;
  priceMin?: number;
  priceMax?: number;
  availableNow?: boolean;
  sortBy?: string;
}

interface SearchContextType {
  searchResults: Provider[];
  loading: boolean;
  error: string | null;
  categories: string[];
  featuredProviders: Provider[];
  popularServices: Service[];
  searchFilters: SearchFilters;
  searchProvidersByLocation: (
    lat: number,
    lng: number,
    radius?: number,
    category?: string | null,
    additionalFilters?: {
      rating?: number;
      priceMin?: number;
      priceMax?: number;
      availableNow?: boolean;
      sortBy?: string;
    }
  ) => Promise<any[]>;
  searchServicesByKeyword: (keyword: string) => Promise<any[]>;
  clearSearchResults: () => void;
}

// Create context
const SearchContext = createContext<SearchContextType | null>(null);

// Search provider component
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<Provider[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: null,
    category: null,
    keyword: '',
    radius: 10
  });

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await searchService.getServiceCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    loadCategories();
  }, []);

  // Load featured providers and popular services on mount
  useEffect(() => {
    const loadFeaturedData = async () => {
      try {
        const [providers, services] = await Promise.all([
          searchService.getFeaturedProviders(),
          searchService.getPopularServices()
        ]);
        setFeaturedProviders(providers);
        setPopularServices(services);
      } catch (err) {
        console.error('Failed to load featured data:', err);
      }
    };

    loadFeaturedData();  }, []);

  // Search providers by location
  const searchProvidersByLocation = async (
    lat: number,
    lng: number,
    radius: number = 10,
    category: string | null = null,
    additionalFilters: any = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, we would pass all filters to the API
      // For now, we'll just use the basic parameters
      const results = await searchService.searchProvidersByLocation(lat, lng, radius, category);

      // Apply client-side filtering for the additional filters
      // This is a simplified implementation - in a real app, these would be server-side filters
      let filteredResults = [...results];

      if (additionalFilters.rating) {
        filteredResults = filteredResults.filter(
          provider => provider.averageRating >= additionalFilters.rating
        );
      }

      if (additionalFilters.availableNow) {
        filteredResults = filteredResults.filter(
          provider => provider.availableTimes && provider.availableTimes.length > 0
        );
      }

      // Sort results
      if (additionalFilters.sortBy) {
        switch (additionalFilters.sortBy) {
          case 'rating':
            filteredResults.sort((a, b) => b.averageRating - a.averageRating);
            break;
          case 'price_low':
            filteredResults.sort((a, b) => {
              const aMinPrice = Math.min(...a.services.map((s: Service) => s.price));
              const bMinPrice = Math.min(...b.services.map((s: Service) => s.price));
              return aMinPrice - bMinPrice;
            });
            break;
          case 'price_high':
            filteredResults.sort((a, b) => {
              const aMaxPrice = Math.max(...a.services.map((s: Service) => s.price));
              const bMaxPrice = Math.max(...b.services.map((s: Service) => s.price));
              return bMaxPrice - aMaxPrice;
            });
            break;
          // distance is the default sort
          default:
            break;
        }
      }

      setSearchResults(filteredResults);
      setSearchFilters({
        ...searchFilters,
        location: { lat, lng },
        radius,
        category,
        ...additionalFilters
      });
      return filteredResults;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search services by keyword
  const searchServicesByKeyword = async (keyword: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchService.searchServicesByKeyword(keyword);
      setSearchResults(results);
      setSearchFilters({
        ...searchFilters,
        keyword
      });
      return results;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear search results
  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchFilters({
      location: null,
      category: null,
      keyword: '',
      radius: 10
    });
  };

  // Context value
  const value = {
    searchResults,
    loading,
    error,
    categories,
    featuredProviders,
    popularServices,
    searchFilters,
    searchProvidersByLocation,
    searchServicesByKeyword,
    clearSearchResults
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

// Custom hook to use search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
