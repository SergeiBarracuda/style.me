'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import searchService from './search.service';

// Types
interface SearchFilters {
  location: any;
  category: any;
  keyword: string;
  priceRange?: [number, number];
  rating?: number;
  radius: number;
  sortBy?: string;
}

interface SearchContextType {
  searchResults: any[];
  loading: boolean;
  error: string | null;
  categories: any[];
  featuredProviders: any[];
  popularServices: any[];
  searchFilters: SearchFilters;
  searchProvidersByLocation: (lat: number, lng: number, radius: number, category: string | null) => Promise<any>;
  searchServicesByKeyword: (keyword: string) => Promise<any>;
  clearSearchResults: () => void;
  loadCategories: () => Promise<void>;
  loadFeaturedProviders: () => Promise<void>;
  loadPopularServices: () => Promise<void>;
}

interface SearchProviderProps {
  children: ReactNode;
}

// Create search context
const SearchContext = createContext<SearchContextType | null>(null);

// Search provider component
export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: null,
    category: null,
    keyword: '',
    radius: 10
  });

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await searchService.getServiceCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  // Load featured providers
  const loadFeaturedProviders = async () => {
    try {
      const data = await searchService.getFeaturedProviders();
      setFeaturedProviders(data);
    } catch (err: any) {
      console.error('Failed to load featured providers:', err);
    }
  };

  // Load popular services
  const loadPopularServices = async () => {
    try {
      const data = await searchService.getPopularServices();
      setPopularServices(data);
    } catch (err: any) {
      console.error('Failed to load popular services:', err);
    }
  };

  // Load categories on mount
  useEffect(() => {
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
      } catch (err: any) {
        console.error('Failed to load featured data:', err);
      }
    };

    loadFeaturedData();
  }, []);

  // Search providers by location
  const searchProvidersByLocation = async (lat: number, lng: number, radius: number, category: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchService.searchProvidersByLocation(lat, lng, radius, category);
      setSearchResults(results);
      setSearchFilters({
        ...searchFilters,
        location: { lat, lng },
        radius,
        category
      });
      return results;
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
    clearSearchResults,
    loadCategories,
    loadFeaturedProviders,
    loadPopularServices
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

// Custom hook to use search context
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
