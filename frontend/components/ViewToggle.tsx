'use client';

import React from 'react';

interface ViewToggleProps {
  view: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
  className?: string;
}

export default function ViewToggle({ view, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 ${className}`}>
      <div className="flex">
        <button
          onClick={() => onViewChange('list')}
          className={`flex-1 py-2 px-4 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            view === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>List</span>
          </div>
        </button>
        <button
          onClick={() => onViewChange('map')}
          className={`flex-1 py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            view === 'map'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Map</span>
          </div>
        </button>
      </div>
    </div>
  );
}

