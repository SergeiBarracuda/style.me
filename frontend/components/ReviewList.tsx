'use client';

import { useState, useEffect } from 'react';
import ReviewCard from '@/components/reviews/ReviewCard';

interface ReviewListProps {
  providerId?: number;
  userId?: number;
  limit?: number;
  showFilters?: boolean;
}

export default function ReviewList({ 
  providerId, 
  userId, 
  limit = 10,
  showFilters = true 
}: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  useEffect(() => {
    // Fetch reviews
    const fetchReviews = async () => {
      try {
        // In a real implementation, this would make an API call to fetch reviews
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock reviews data
        const mockReviews = [
          {
            id: 'rev-001',
            user: {
              name: 'John Smith',
              photo: '/placeholder-profile.jpg',
            },
            rating: 5,
            text: 'Sarah is an amazing stylist! She listened to exactly what I wanted and gave me the best haircut I\'ve ever had. The salon was clean and welcoming, and Sarah made me feel comfortable throughout the entire appointment. I\'ve already booked my next appointment with her.',
            date: '2025-04-15T14:30:00Z',
            serviceType: 'Women\'s Haircut & Style',
          },
          {
            id: 'rev-002',
            user: {
              name: 'Emily Johnson',
              photo: '/placeholder-profile.jpg',
            },
            rating: 4,
            text: 'Great experience overall. Michael is very professional and knowledgeable. The massage was exactly what I needed for my back pain. The only reason I\'m not giving 5 stars is because the room was a bit cold. Otherwise, highly recommended!',
            date: '2025-04-10T11:00:00Z',
            serviceType: 'Deep Tissue Massage',
            providerResponse: {
              text: 'Thank you for your feedback, Emily! I appreciate your kind words and will make sure to adjust the room temperature for your next visit. Looking forward to seeing you again!',
              date: '2025-04-11T09:15:00Z',
            },
          },
          {
            id: 'rev-003',
            user: {
              name: 'Anonymous User',
              isAnonymous: true,
            },
            rating: 3,
            text: 'The service was okay. Jessica did a good job on my nails, but the polish started chipping after just 3 days. For the price, I expected it to last longer. The salon was nice and clean though.',
            date: '2025-04-05T16:45:00Z',
            serviceType: 'Gel Manicure',
          },
          {
            id: 'rev-004',
            user: {
              name: 'Robert Chen',
              photo: '/placeholder-profile.jpg',
            },
            rating: 5,
            text: 'David is the best barber I\'ve ever had! He pays attention to detail and always gives me exactly the cut I want. The hot towel shave was an amazing experience too. Highly recommend!',
            date: '2025-04-02T10:30:00Z',
            serviceType: 'Men\'s Haircut & Shave',
          },
          {
            id: 'rev-005',
            user: {
              name: 'Sophia Williams',
              photo: '/placeholder-profile.jpg',
            },
            rating: 2,
            text: 'I was disappointed with my makeup application. Emily seemed rushed and didn\'t listen to what I wanted. The foundation was too dark for my skin tone, and the eye makeup was much heavier than I asked for. I had to fix it myself when I got home.',
            date: '2025-03-28T13:15:00Z',
            serviceType: 'Bridal Makeup Trial',
            providerResponse: {
              text: 'I\'m very sorry to hear about your experience, Sophia. I would love the opportunity to make this right. Please contact me directly so we can discuss how I can better meet your expectations for your upcoming event.',
              date: '2025-03-29T10:00:00Z',
            },
          },
        ];
        
        // Filter reviews if providerId or userId is provided
        let filteredReviews = [...mockReviews];
        
        // Apply rating filter if not 'all'
        if (filter !== 'all') {
          filteredReviews = filteredReviews.filter(review => review.rating === filter);
        }
        
        // Apply sorting
        filteredReviews.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          
          switch (sort) {
            case 'newest':
              return dateB - dateA;
            case 'oldest':
              return dateA - dateB;
            case 'highest':
              return b.rating - a.rating;
            case 'lowest':
              return a.rating - b.rating;
            default:
              return dateB - dateA;
          }
        });
        
        // Apply limit
        if (limit) {
          filteredReviews = filteredReviews.slice(0, limit);
        }
        
        setReviews(filteredReviews);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [providerId, userId, limit, filter, sort]);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  // Calculate rating distribution
  const ratingDistribution = [0, 0, 0, 0, 0]; // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
  reviews.forEach(review => {
    ratingDistribution[5 - review.rating]++;
  });
  
  // Calculate rating percentages
  const ratingPercentages = ratingDistribution.map(count => 
    reviews.length > 0 ? (count / reviews.length) * 100 : 0
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</span>
                <div className="ml-2 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(averageRating)
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
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{star} star</span>
                  </div>
                  <div className="flex-1 h-4 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${ratingPercentages[index]}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {ratingDistribution[index]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex space-x-2 mb-3 sm:mb-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setFilter(star as any)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === star
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {star} ★
                </button>
              ))}
            </div>
            
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mb-3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-300">
              No reviews found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
