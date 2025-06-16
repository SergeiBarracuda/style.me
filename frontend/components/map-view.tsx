'use client';

import { useState, useEffect } from 'react';
import ProviderMap from './ProviderMap';
import { useTheme } from 'next-themes';
import providerService, { Provider, ProviderSearchParams } from './providerService';

interface MapViewProps {
  filters: ProviderSearchParams;
}

export default function MapView({ filters }: MapViewProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await providerService.searchProviders(filters);
        setProviders(response.providers);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load providers. Please try again later.');
        // Fallback to empty array
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [filters]);

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

  if (providers.length === 0) {
    return (
      <div className="h-[600px] flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-gray-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">No providers found matching your criteria.</p>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search in a different area.</p>
      </div>
    );
  }

  // Transform providers to the format expected by ProviderMap
  const mappedProviders = providers.map(provider => ({
    id: provider.id,
    name: `${provider.user.firstName} ${provider.user.lastName}`,
    profilePhoto: provider.user.profilePhoto || '/placeholder-profile.jpg',
    primaryService: provider.services[0]?.name || 'Service Provider',
    rating: provider.averageRating,
    location: { lat: provider.latitude, lng: provider.longitude },
    distance: provider.distance ? `${provider.distance.toFixed(1)} miles` : undefined,
    availableTimes: provider.availableTimes,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <ProviderMap 
        providers={mappedProviders} 
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
