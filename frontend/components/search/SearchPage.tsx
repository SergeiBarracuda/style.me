'use client';

import React, { useState } from 'react';
import { SearchProvider } from '@/contexts/SearchContext';
import GoogleMapProvider from '../GoogleMapProvider';
import SearchForm from './SearchForm';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import ViewToggle from './ViewToggle';
import MapView from '../map-view';

export default function SearchPage() {
  const [view, setView] = useState<'map' | 'list'>('map');

  return (
    <SearchProvider>
      <GoogleMapProvider>
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
              <ViewToggle view={view} onViewChange={setView} />

              {view === 'map' ? (
                <div className="h-[600px]">
                  <MapView filters={{}} />
                </div>
              ) : (
                <SearchResults />
              )}
            </div>
          </div>
        </div>
      </GoogleMapProvider>
    </SearchProvider>
  );
}
