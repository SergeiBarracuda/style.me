'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ReviewCardProps {
  review: {
    id: string;
    user: {
      name: string;
      photo?: string;
      isAnonymous?: boolean;
    };
    rating: number;
    text: string;
    date: string;
    serviceType: string;
    providerResponse?: {
      text: string;
      date: string;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Determine if review text should be truncated
  const shouldTruncate = review.text.length > 200;
  const truncatedText = shouldTruncate && !expanded
    ? `${review.text.substring(0, 200)}...`
    : review.text;
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {review.user.isAnonymous ? (
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          ) : (
            <div className="relative h-10 w-10 rounded-full overflow-hidden">
              <Image
                src={review.user.photo || '/placeholder-profile.jpg'}
                alt={review.user.name}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {review.user.isAnonymous ? 'Anonymous User' : review.user.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(review.date)} • {review.serviceType}
              </p>
            </div>
            
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {truncatedText}
            </p>
            
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          
          {/* Provider Response */}
          {review.providerResponse && (
            <div className="mt-3 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Response from provider:
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {review.providerResponse.text}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {formatDate(review.providerResponse.date)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
