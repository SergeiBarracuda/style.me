'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsiveCard({ children, className = '' }: ResponsiveCardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // Initial check
      setIsMobile(window.innerWidth < 768);

      // Add resize listener
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden 
      ${isMobile ? 'mx-0 p-4' : 'p-6'} 
      ${className}`}>
      {children}
    </div>
  );
}
