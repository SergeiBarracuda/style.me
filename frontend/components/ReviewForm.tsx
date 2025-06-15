'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ReviewFormProps {
  bookingId: string;
  providerId: number;
  providerName: string;
  providerPhoto: string;
  serviceName: string;
}

export default function ReviewForm({
  bookingId,
  providerId,
  providerName,
  providerPhoto,
  serviceName,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle star hover
  const handleStarHover = (hoveredRating: number) => {
    setHoverRating(hoveredRating);
  };
  
  // Handle star click
  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (reviewText.trim().length < 10) {
      setError('Please provide a review with at least 10 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would make an API call to submit the review
      // For now, we'll simulate a successful submission
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to success page
      router.push(`/review/success?provider=${providerId}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('An error occurred while submitting your review. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={providerPhoto || '/placeholder-profile.jpg'}
              alt={providerName}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rate your experience with {providerName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Service: {serviceName}
            </p>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </label>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={() => handleStarHover(0)}
                  onClick={() => handleStarClick(star)}
                  className="h-10 w-10 focus:outline-none"
                >
                  <svg
                    className={`h-full w-full ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                {rating > 0 ? (
                  <>
                    <span className="font-medium">
                      {rating === 1
                        ? 'Poor'
                        : rating === 2
                        ? 'Fair'
                        : rating === 3
                        ? 'Good'
                        : rating === 4
                        ? 'Very Good'
                        : 'Excellent'}
                    </span>
                    <span className="ml-1">({rating}/5)</span>
                  </>
                ) : (
                  'Select a rating'
                )}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review
            </label>
            <textarea
              id="reviewText"
              rows={5}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this service provider..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {reviewText.length} / 500 characters (minimum 10)
            </p>
          </div>
          
          <div className="flex items-center mb-6">
            <input
              id="anonymous"
              name="anonymous"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Post anonymously
            </label>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            <p>Your review will be public and visible to other users. By submitting, you agree to our review guidelines.</p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
