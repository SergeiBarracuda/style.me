'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from './maps';

// Libraries to load
const libraries = ['places', 'geometry', 'drawing'];

// Context to track if maps API is loaded
type GoogleMapsContextType = {
  isLoaded: boolean;
  loadError: Error | undefined;
};

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapProviderProps {
  children: ReactNode;
}

export default function GoogleMapProvider({ children }: GoogleMapProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={libraries as any}
      onLoad={() => setIsLoaded(true)}
      onError={(error) => setLoadError(error as Error)}
      loadingElement={<div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}
