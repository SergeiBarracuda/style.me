'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NotificationProps {
  userId: number;
  limit?: number;
}

interface Notification {
  id: string;
  userId: number;
  type: 'message' | 'booking' | 'review' | 'system';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  linkTo?: string;
  sender?: {
    id: number;
    name: string;
    photo: string;
  };
}

export default function NotificationCenter({ userId, limit }: NotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        // In a real implementation, this would make an API call to fetch notifications
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock notifications data
        const mockNotifications: Notification[] = [
          {
            id: 'notif-001',
            userId: 101,
            type: 'message',
            title: 'New message from Sarah Johnson',
            content: 'Looking forward to seeing you tomorrow!',
            timestamp: '2025-04-26T14:30:00Z',
            isRead: false,
            linkTo: '/messages',
            sender: {
              id: 1,
              name: 'Sarah Johnson',
              photo: '/placeholder-profile.jpg',
            },
          },
          {
            id: 'notif-002',
            userId: 101,
            type: 'booking',
            title: 'Booking Confirmation',
            content: 'Your appointment with Sarah Johnson on Tuesday at 2:30 PM has been confirmed.',
            timestamp: '2025-04-25T10:45:00Z',
            isRead: true,
            linkTo: '/booking/confirmation?id=bk-001',
          },
          {
            id: 'notif-003',
            userId: 101,
            type: 'review',
            title: 'Review Request',
            content: 'How was your experience with Michael Chen? Leave a review to help others.',
            timestamp: '2025-04-24T09:15:00Z',
            isRead: false,
            linkTo: '/review/create/bk-002',
          },
          {
            id: 'notif-004',
            userId: 101,
            type: 'message',
            title: 'New message from Jessica Williams',
            content: 'I have a few nail design options to show you. Would you like to see them before your appointment?',
            timestamp: '2025-04-24T16:45:00Z',
            isRead: false,
            linkTo: '/messages',
            sender: {
              id: 3,
              name: 'Jessica Williams',
              photo: '/placeholder-profile.jpg',
            },
          },
          {
            id: 'notif-005',
            userId: 101,
            type: 'system',
            title: 'Welcome to Beauty Marketplace',
            content: 'Thank you for joining our platform. Discover beauty services near you and book appointments with top-rated professionals.',
            timestamp: '2025-04-20T08:00:00Z',
            isRead: true,
            linkTo: '/search',
          },
        ];
        
        setNotifications(mockNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [userId]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'booking':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // In a real implementation, this would make an API call to mark the notification as read
      // For now, we'll just update the local state
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Get notifications to display
  const displayNotifications = limit && !showAll
    ? notifications.slice(0, limit)
    : notifications;

  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        {unreadCount > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {unreadCount} unread
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">No notifications yet.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.linkTo || '#'}
                className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {notification.sender ? (
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={notification.sender.photo || '/placeholder-profile.jpg'}
                        alt={notification.sender.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    getNotificationIcon(notification.type)
                  )}
                  
                  <div className="ml-3 flex-1">
                    <p className={`text-sm ${
                      !notification.isRead
                        ? 'font-medium text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="ml-2 h-2 w-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          {limit && notifications.length > limit && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {showAll ? 'Show less' : `View all ${notifications.length} notifications`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
