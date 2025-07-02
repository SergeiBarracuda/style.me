'use client';

import React from 'react';
import { useSearch } from '../contexts/SearchContext';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResultsProps {
  className?: string;
}

// Type definitions for provider and service results
interface Provider {
  id: string;
  businessName: string;
  user: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  averageRating: number;
  reviewCount: number;
  address?: string;
  distance?: number;
  services?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  availableTimes?: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category: string;
  imageUrl?: string;
  provider: {
    id: string;
    businessName?: string;
    user: {
      firstName: string;
      lastName: string;
    };
    averageRating?: number;
  };
}

export default function SearchResults({ className = '' }: SearchResultsProps) {
  const { searchResults, loading, error } = useSearch();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex flex-col justify-center items-center h-64">
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
      </div>
    );
  }

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-gray-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300">No results found</p>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search criteria or filters</p>
        </div>
      </div>
    );
  }

  // Determine if results are providers or services
  const isProviderResults = searchResults.length > 0 && 'businessName' in searchResults[0];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {searchResults.length} {isProviderResults ? 'Providers' : 'Services'} Found
        </h2>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {searchResults.map((result) => (
          <div key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            {isProviderResults ? (
              <ProviderResultCard provider={result as Provider} />
            ) : (
              // Type guard to ensure result is a Service
              'name' in result && 'price' in result && 'duration' in result && 'category' in result && 'provider' in result ? (
                <ServiceResultCard service={result as Service} />
              ) : null
            )}
          </div>
        ))}
      </div>

      {/* Pagination would go here */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
        <nav className="flex items-center space-x-2">
          <button className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
            Previous
          </button>
          <span className="px-3 py-1 rounded-md bg-blue-600 text-white">1</span>
          <button className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}

// Provider result card component
function ProviderResultCard({ provider }: { provider: Provider }) {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
        <div className="relative h-24 w-24 rounded-full overflow-hidden">
          <Image
            src={provider.user.profilePhoto || '/placeholder-profile.jpg'}
            alt={provider.businessName}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {provider.businessName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {provider.user.firstName} {provider.user.lastName}
            </p>

            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(provider.averageRating)
                      ? 'text-yellow-400'
                      : i < provider.averageRating
                      ? 'text-yellow-400 opacity-50'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                {provider.averageRating.toFixed(1)} ({provider.reviewCount})
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {provider.address}
              {provider.distance && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  {provider.distance.toFixed(1)} miles away
                </span>
              )}
            </p>
          </div>

          <div className="mt-3 md:mt-0">
            <Link
              href={`/provider/${provider.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Profile
            </Link>
          </div>
        </div>

        {provider.services && provider.services.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Services:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {provider.services.slice(0, 3).map((service: any) => (
                <span
                  key={service.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {service.name} - ${service.price.toFixed(2)}
                </span>
              ))}
              {provider.services.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{provider.services.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {provider.availableTimes && provider.availableTimes.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Today:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.availableTimes.slice(0, 4).map((time: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded"
                >
                  {time}
                </span>
              ))}
              {provider.availableTimes.length > 4 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{provider.availableTimes.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Service result card component
function ServiceResultCard({ service }: { service: Service }) {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-4">
        <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          {service.imageUrl ? (
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {service.name}
            </h3>

            <div className="flex items-center mt-1">
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                ${service.price.toFixed(2)}
              </span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                ({service.duration} min)
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {service.description && service.description.length > 100
                ? `${service.description.substring(0, 100)}...`
                : service.description}
            </p>

            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {service.category}
              </span>
            </div>
          </div>

          <div className="mt-3 md:mt-0 flex flex-col items-end">
            <Link
              href={`/provider/${service.provider.id}`}
              className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
            >
              {service.provider.businessName || `${service.provider.user.firstName} ${service.provider.user.lastName}`}
            </Link>

            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => {
                const rating = service.provider.averageRating || 0;
                return (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'text-yellow-400'
                        : i < rating
                        ? 'text-yellow-400 opacity-50'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              })}
              <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                {service.provider.averageRating?.toFixed(1) || 'N/A'}
              </span>
            </div>

            <Link
              href={`/booking/${service.id}`}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
