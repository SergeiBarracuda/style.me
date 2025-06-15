'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ServiceProviderProfileProps {
  id: number;
  name: string;
  profilePhoto: string;
  coverPhoto?: string;
  primaryService: string;
  rating: number;
  totalReviews: number;
  description: string;
  services: {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
  }[];
  location: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    isHomeBased: boolean;
  };
  availability: {
    day: string;
    slots: string[];
  }[];
}

export default function ServiceProviderProfile({
  id,
  name,
  profilePhoto,
  coverPhoto,
  primaryService,
  rating,
  totalReviews,
  description,
  services,
  location,
  availability,
}: ServiceProviderProfileProps) {
  const [selectedTab, setSelectedTab] = useState('services');
  const [selectedDay, setSelectedDay] = useState(availability[0]?.day || '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-48 w-full">
        <Image
          src={coverPhoto || '/placeholder-cover.jpg'}
          alt={`${name} cover`}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Profile Header */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-12 mb-6">
          <div className="relative h-32 w-32 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md mx-auto sm:mx-0">
            <Image
              src={profilePhoto || '/placeholder-profile.jpg'}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{primaryService}</p>
            
            <div className="flex items-center mt-2 justify-center sm:justify-start">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
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
                <span className="ml-2 text-gray-600 dark:text-gray-300">
                  {rating.toFixed(1)} ({totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-0 sm:ml-auto flex flex-col sm:flex-row gap-2">
            <Link
              href={`/booking/${id}`}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              Book Now
            </Link>
            <Link
              href={`/messages/${id}`}
              className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
            >
              Message
            </Link>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'services'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setSelectedTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'about'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setSelectedTab('availability')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'availability'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Availability
            </button>
            <button
              onClick={() => setSelectedTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'reviews'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="py-6">
          {selectedTab === 'services' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Services Offered</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {service.duration} min
                        </p>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${service.price.toFixed(2)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {service.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/booking/${id}?service=${service.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Book This Service
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About {name}</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300">{description}</p>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Location</h3>
                <div className="mt-2 flex items-start">
                  <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="ml-3 text-gray-600 dark:text-gray-300">
                    {location.isHomeBased ? (
                      <p>Home-based business in {location.city}, {location.state} {location.postalCode}</p>
                    ) : (
                      <p>
                        {location.address}<br />
                        {location.city}, {location.state} {location.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'availability' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Availability</h2>
              
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {availability.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedDay === day.day
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Available slots for {selectedDay}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {availability
                    .find((day) => day.day === selectedDay)
                    ?.slots.map((slot, index) => (
                      <Link
                        key={index}
                        href={`/booking/${id}?date=${selectedDay}&time=${slot}`}
                        className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-center hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                      >
                        {slot}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reviews ({totalReviews})
                </h2>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
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
                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                Reviews will be displayed here. This is a placeholder for the reviews section.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
