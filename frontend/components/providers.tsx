'use client';

import { useEffect, ReactNode } from 'react';
import { AppProvider } from './AppProvider';
import { usePathname } from 'next/navigation';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
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
