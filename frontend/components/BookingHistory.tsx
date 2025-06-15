'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BookingHistoryProps {
  bookings: {
    id: string;
    provider: {
      id: number;
      name: string;
      profilePhoto: string;
    };
    service: {
      name: string;
    };
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    totalAmount: number;
  }[];
}

export default function BookingHistory({ bookings }: BookingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  // Filter bookings based on selected filter
  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === filter);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Bookings</h2>
        
        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-4 text-sm font-medium ${
              filter === 'all'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`py-2 px-4 text-sm font-medium ${
              filter === 'upcoming'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-2 px-4 text-sm font-medium ${
              filter === 'completed'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`py-2 px-4 text-sm font-medium ${
              filter === 'cancelled'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Cancelled
          </button>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">No {filter !== 'all' ? filter : ''} bookings found.</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-blue-600 hover:underline dark:text-blue-400"
              >
                View all bookings
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {booking.service.name} with {booking.provider.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {booking.date} at {booking.time}
                    </p>
                  </div>
                  
                  <div className="mt-2 sm:mt-0">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : booking.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Total: ${booking.totalAmount.toFixed(2)}
                  </div>
                  
                  <div className="mt-3 sm:mt-0 flex space-x-2">
                    {booking.status === 'upcoming' && (
                      <>
                        <Link
                          href={`/booking/reschedule/${booking.id}`}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Reschedule
                        </Link>
                        <Link
                          href={`/booking/cancel/${booking.id}`}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Cancel
                        </Link>
                      </>
                    )}
                    
                    {booking.status === 'completed' && (
                      <Link
                        href={`/review/create/${booking.id}`}
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
                      >
                        Leave Review
                      </Link>
                    )}
                    
                    <Link
                      href={`/booking/details/${booking.id}`}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
