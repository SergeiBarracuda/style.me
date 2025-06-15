'use client';

import { useEffect } from 'react';
import { AppProvider } from './context/AppProvider';
import { usePathname } from 'next/navigation';

export function Providers({ children }) {
  const pathname = usePathname();

  // Log navigation for debugging purposes
  useEffect(() => {
    console.log('Navigation to:', pathname);
  }, [pathname]);

  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
