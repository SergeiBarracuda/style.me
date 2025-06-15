// Update the maps.ts file to use environment variables for API key

// Google Maps API key from environment variables
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

// Default map center (can be updated based on user's location)
export const DEFAULT_CENTER = {
  lat: 40.7128,
  lng: -74.0060
};

// Default zoom level
export const DEFAULT_ZOOM = 13;

// Map styles for light mode
export const LIGHT_MODE_STYLES = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [
      {
        weight: '2.00'
      }
    ]
  },
  // ... rest of the light mode styles remain unchanged
];

// Map styles for dark mode
export const DARK_MODE_STYLES = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#242f3e'
      }
    ]
  },
  // ... rest of the dark mode styles remain unchanged
];

// Helper function to get directions using Google Directions API
export const getDirections = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'DRIVING' | 'WALKING' | 'TRANSIT' = 'DRIVING'
) => {
  try {
    // Make actual API call to Google Directions API
    const response = await fetch(`/api/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode.toLowerCase()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch directions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};

// Helper function to get user's current location
export const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          reject(error);
        }
      );
    } else {
      const error = new Error('Geolocation is not supported by this browser.');
      console.error(error);
      reject(error);
    }
  });
};
