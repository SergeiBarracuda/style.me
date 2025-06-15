'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  userRole?: 'provider' | 'client';
}

export default function MobileNav({ userRole = 'client' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // In a real implementation, this would fetch unread counts from an API
    // For now, we'll use mock data
    setUnreadMessages(3);
    setUnreadNotifications(2);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center justify-center w-full h-full">
            <svg className={`h-6 w-6 ${pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href="/search" className="flex flex-col items-center justify-center w-full h-full">
            <svg className={`h-6 w-6 ${pathname === '/search' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-1">Search</span>
          </Link>
          
          <Link href="/messages" className="flex flex-col items-center justify-center w-full h-full relative">
            <svg className={`h-6 w-6 ${pathname === '/messages' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute top-0 right-1/4 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {unreadMessages}
              </span>
            )}
            <span className="text-xs mt-1">Messages</span>
          </Link>
          
          <Link href="/notifications" className="flex flex-col items-center justify-center w-full h-full relative">
            <svg className={`h-6 w-6 ${pathname === '/notifications' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-1/4 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {unreadNotifications}
              </span>
            )}
            <span className="text-xs mt-1">Alerts</span>
          </Link>
          
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
              
              <div className="space-y-4">
                {userRole === 'client' ? (
                  <>
                    <Link href="/client/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">My Profile</span>
                    </Link>
                    
                    <Link href="/client/bookings" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">My Bookings</span>
                    </Link>
                    
                    <Link href="/client/favorites" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">Favorites</span>
                    </Link>
                    
                    <Link href="/client/reviews" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">My Reviews</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/provider/profile" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">My Profile</span>
                    </Link>
                    
                    <Link href="/provider/services" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">My Services</span>
                    </Link>
                    
                    <Link href="/provider/appointments" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">Appointments</span>
                    </Link>
                    
                    <Link href="/provider/reviews" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">Reviews</span>
                    </Link>
                    
                    <Link href="/provider/earnings" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white">Earnings</span>
                    </Link>
                  </>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                
                <Link href="/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">Settings</span>
                </Link>
                
                <Link href="/help" className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">Help & Support</span>
                </Link>
                
                <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer for mobile navigation */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}
