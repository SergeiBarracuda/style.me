'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ClientProfileProps {
  id: number;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  email: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
  };
  bookingHistory: {
    id: number;
    date: string;
    providerName: string;
    serviceName: string;
    status: 'upcoming' | 'completed' | 'cancelled';
  }[];
  favoriteProviders: {
    id: number;
    name: string;
    profilePhoto: string;
    primaryService: string;
  }[];
}

export default function ClientProfile({
  id,
  firstName,
  lastName,
  profilePhoto,
  email,
  phone,
  location,
  bookingHistory,
  favoriteProviders,
}: ClientProfileProps) {
  const [selectedTab, setSelectedTab] = useState('bookings');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Profile Header */}
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
            <Image
              src={profilePhoto || '/placeholder-profile.jpg'}
              alt={`${firstName} ${lastName}`}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {firstName} {lastName}
            </h1>
            
            <div className="mt-2 text-gray-600 dark:text-gray-300">
              <p>{email}</p>
              {phone && <p>{phone}</p>}
              {location && (
                <p className="mt-1">
                  {location.city}, {location.state}
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <Link
                href="/client/edit-profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mt-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'bookings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Booking History
            </button>
            <button
              onClick={() => setSelectedTab('favorites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'favorites'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Favorite Providers
            </button>
            <button
              onClick={() => setSelectedTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="py-6">
          {selectedTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Bookings</h2>
              
              {bookingHistory.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">You don't have any bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Provider
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Service
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {bookingHistory.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {booking.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {booking.providerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {booking.serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : booking.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/booking/${booking.id}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {selectedTab === 'favorites' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Favorite Providers</h2>
              
              {favoriteProviders.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">You don't have any favorite providers yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteProviders.map((provider) => (
                    <div key={provider.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={provider.profilePhoto || '/placeholder-profile.jpg'}
                          alt={provider.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{provider.primaryService}</p>
                        <div className="mt-2">
                          <Link
                            href={`/provider/${provider.id}`}
                            className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="booking-confirmations"
                        name="booking-confirmations"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="booking-confirmations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Booking confirmations
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="booking-reminders"
                        name="booking-reminders"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="booking-reminders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Booking reminders
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="messages"
                        name="messages"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="messages" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        New messages
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="promotions"
                        name="promotions"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="promotions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Promotions and offers
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Password</h3>
                  <div className="mt-4">
                    <Link
                      href="/client/change-password"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Change Password
                    </Link>
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Delete Account</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
