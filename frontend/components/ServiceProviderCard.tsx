'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ServiceProviderCardProps {
  id: number;
  name: string;
  profilePhoto: string;
  primaryService: string;
  rating: number;
  distance: string;
  description: string;
  availableTimes?: string[];
}

export default function ServiceProviderCard({
  id,
  name,
  profilePhoto,
  primaryService,
  rating,
  distance,
  description,
  availableTimes = [],
}: ServiceProviderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-4">
        <div className="flex items-start">
          <div className="relative h-20 w-20 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={profilePhoto || '/placeholder-profile.jpg'}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{primaryService}</p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
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
                  ))}
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{distance} away</span>
              </div>
            </div>
            
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {description}
            </p>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {availableTimes && availableTimes.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Available Today</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map((time, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <div className="flex-1 flex gap-2">
                <button className="flex items-center justify-center px-3 py-1.5 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Walking
                </button>
                <button className="flex items-center justify-center px-3 py-1.5 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Transit
                </button>
                <button className="flex items-center justify-center px-3 py-1.5 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  Driving
                </button>
              </div>
              
              <Link
                href={`/provider/${id}`}
                className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Profile
              </Link>
              
              <Link
                href={`/booking/${id}`}
                className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
