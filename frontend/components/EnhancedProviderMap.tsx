'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle, MarkerClusterer } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import { 
  DEFAULT_CENTER, 
  DEFAULT_ZOOM,   LIGHT_MODE_STYLES, 
  DARK_MODE_STYLES,
  getUserLocation
} from './maps';

interface Provider {
  id: number;
  name: string;
  profilePhoto: string;
  primaryService: string;
  rating: number;
  location: {
    lat: number;
    lng: number;
  };
  distance?: string;
  availableTimes?: string[];
}

interface EnhancedProviderMapProps {
  providers: Provider[];
  isDarkMode?: boolean;
  height?: string;
  width?: string;
  onMarkerClick?: (provider: Provider) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  enableClustering?: boolean;
  showSearchRadius?: boolean;
  searchRadius?: number;
  searchLocation?: { lat: number; lng: number } | null;
}

export default function EnhancedProviderMap({
  providers,
  isDarkMode = false,
  height = '600px',
  width = '100%',
  onMarkerClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  enableClustering = true,
  showSearchRadius = false,
  searchRadius = 10,
  searchLocation = null,
}: EnhancedProviderMapProps) {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Update map center and zoom when props change
  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
    if (zoom) {
      setMapZoom(zoom);
    }
  }, [center, zoom]);

  // Get user location on mount if no center is provided
  useEffect(() => {
    if (!center || (center.lat === DEFAULT_CENTER.lat && center.lng === DEFAULT_CENTER.lng)) {
      const fetchUserLocation = async () => {
        try {
          const location = await getUserLocation();
          setMapCenter(location);
        } catch (error) {
          console.error('Error getting user location:', error);
          // Keep default center if user location can't be determined
        }
      };

      fetchUserLocation();
    }
  }, [center]);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Handle map load error
  const onLoadError = useCallback((error: Error) => {
    console.error('Error loading Google Maps:', error);
    setMapError('Failed to load map. Please check your internet connection and try again.');
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMapLoaded(false);
  }, []);

  // Handle marker click
  const handleMarkerClick = (provider: Provider) => {
    setSelectedProvider(provider);
    if (onMarkerClick) {
      onMarkerClick(provider);
    }
  };

  // Close info window
  const handleInfoWindowClose = () => {
    setSelectedProvider(null);
  };

  // Clusterer options
  const clustererOptions = {
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 50,
    minimumClusterSize: 3,
    maxZoom: 15
  };

  // Calculate search radius in meters
  const searchRadiusInMeters = searchRadius * 1609.34; // Convert miles to meters

  if (mapError) {
    return (
      <div 
        style={{ height, width }}
        className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
      >
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-center text-gray-700 dark:text-gray-300">{mapError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ height, width }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          styles: isDarkMode ? DARK_MODE_STYLES : LIGHT_MODE_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {mapLoaded && (
          <>
            {/* Search radius circle */}
            {showSearchRadius && searchLocation && (
              <Circle
                center={searchLocation}
                radius={searchRadiusInMeters}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Render markers with clustering */}
            {enableClustering ? (
              <MarkerClusterer options={clustererOptions}>
                {(clusterer) => (
                  <>
                    {providers.map((provider) => (
                      <Marker
                        key={provider.id}
                        position={provider.location}
                        onClick={() => handleMarkerClick(provider)}
                        clusterer={clusterer}
                        icon={{
                          url: '/marker-icon.png', // This would be a custom marker icon
                          scaledSize: new google.maps.Size(40, 40),
                        }}
                      />
                    ))}
                  </>
                )}
              </MarkerClusterer>
            ) : (
              // Render markers without clustering
              providers.map((provider) => (
                <Marker
                  key={provider.id}
                  position={provider.location}
                  onClick={() => handleMarkerClick(provider)}
                  icon={{
                    url: '/marker-icon.png', // This would be a custom marker icon
                    scaledSize: new google.maps.Size(40, 40),
                  }}
                />
              ))
            )}

            {/* Info window for selected provider */}
            {selectedProvider && (
              <InfoWindow
                position={selectedProvider.location}
                onCloseClick={handleInfoWindowClose}
              >
                <div className="p-2 max-w-xs">
                  <div className="flex items-start">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedProvider.profilePhoto || '/placeholder-profile.jpg'}
                        alt={selectedProvider.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">{selectedProvider.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProvider.primaryService}</p>
                      
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(selectedProvider.rating)
                                ? 'text-yellow-400'
                                : i < selectedProvider.rating
                                ? 'text-yellow-400 opacity-50'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-gray-600">{selectedProvider.rating.toFixed(1)}</span>
                      </div>
                      
                      {selectedProvider.distance && (
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedProvider.distance}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedProvider.availableTimes && selectedProvider.availableTimes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Available Today:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProvider.availableTimes.slice(0, 3).map((time, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {time}
                          </span>
                        ))}
                        {selectedProvider.availableTimes.length > 3 && (
                          <span className="text-xs text-gray-500">+{selectedProvider.availableTimes.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-between">
                    <div className="flex space-x-1">
                      <button className="p-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button className="p-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                      <button className="p-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                      </button>
                    </div>
                    
                    <Link
                      href={`/provider/${selectedProvider.id}`}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </GoogleMap>
    </div>
  );
}

