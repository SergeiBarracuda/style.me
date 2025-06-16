'use client';

import React, { useState, useEffect } from 'react';
import { SearchProvider } from '@/contexts/SearchContext';
import GoogleMapProvider from '../GoogleMapProvider';
import SearchForm from './SearchForm';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import ViewToggle from './ViewToggle';
import EnhancedMapView from '@/components/maps/EnhancedMapView';
import { useSearch } from '@/contexts/SearchContext';

// Main search page wrapper that provides context
export default function EnhancedSearchPage() {
  return (
    <SearchProvider>
      <GoogleMapProvider>
        <SearchPageContent />
      </GoogleMapProvider>
    </SearchProvider>
  );
}

// Inner component that uses the search context
function SearchPageContent() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const { searchResults, loading, featuredProviders } = useSearch();
  const [showIntro, setShowIntro] = useState(true);

  // Hide intro when search results are available
  useEffect(() => {
    if (searchResults.length > 0) {
      setShowIntro(false);
    }
  }, [searchResults]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Find Beauty Services Near You
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with search form and filters */}
        <div className="lg:col-span-1 space-y-6">
          <SearchForm />
          <SearchFilters />
        </div>
        
        {/* Main content area with view toggle and results */}
        <div className="lg:col-span-3 space-y-4">
          {/* View toggle only shows when there are search results */}
          {searchResults.length > 0 && (
            <ViewToggle view={view} onViewChange={setView} />
          )}
          
          {/* Show intro or search results based on state */}
          {showIntro && !loading && searchResults.length === 0 ? (
            <IntroSection featuredProviders={featuredProviders} />
          ) : (
            <>
              {view === 'map' ? (
                <div className="h-[600px]">
                  <EnhancedMapView />
                </div>
              ) : (
                <SearchResults />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Intro section shown before search
function IntroSection({ featuredProviders }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Welcome to Beauty Service Marketplace
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Find and book beauty services in your area. Use the search form to find providers near you,
        or browse our featured providers below.
      </p>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
        Featured Providers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredProviders.slice(0, 6).map((provider) => (
          <FeaturedProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
          How It Works
        </h3>
        
        <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>Search for beauty services by location or keyword</li>
          <li>Filter results by category, rating, or availability</li>
          <li>View provider profiles and available services</li>
          <li>Book appointments directly through the platform</li>
          <li>Rate and review your experience</li>
        </ol>
      </div>
    </div>
  );
}

// Featured provider card component
function FeaturedProviderCard({ provider }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center">
          <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={provider.user.profilePhoto || '/placeholder-profile.jpg'}
              alt={provider.businessName}
              className="object-cover w-full h-full"
            />
          </div>
          
          <div className="ml-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {provider.businessName}
            </h4>
            
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(provider.averageRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                {provider.averageRating?.toFixed(1) || 'New'}
              </span>
            </div>
          </div>
        </div>
        
        {provider.services && provider.services.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Popular services:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.services.slice(0, 2).map((service) => (
                <span
                  key={service.id}
                  className="text-xs text-gray-700 dark:text-gray-300"
                >
                  {service.name} (${service.price})
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-3 flex justify-end">
          <a
            href={`/provider/${provider.id}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Profile →
          </a>
        </div>
      </div>
    </div>
  );
}

