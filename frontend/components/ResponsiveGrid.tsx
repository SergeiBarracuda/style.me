'use client';

import { useState, useEffect } from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export default function ResponsiveGrid({ 
  children, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = { sm: 4, md: 6, lg: 8, xl: 8 },
  className = '' 
}: ResponsiveGridProps) {
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // Function to determine screen size
      const determineScreenSize = () => {
        const width = window.innerWidth;
        if (width < 640) return 'sm';
        if (width < 768) return 'md';
        if (width < 1024) return 'lg';
        return 'xl';
      };

      // Initial check
      setScreenSize(determineScreenSize());

      // Add resize listener
      const handleResize = () => {
        setScreenSize(determineScreenSize());
      };

      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Determine grid columns and gap based on screen size
  const gridColumns = columns[screenSize] || columns.md || 2;
  const gridGap = gap[screenSize] || gap.md || 6;

  return (
    <div 
      className={`grid grid-cols-${gridColumns} gap-${gridGap} ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        gap: `${gridGap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
}
