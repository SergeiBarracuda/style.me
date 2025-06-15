import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedMapView from '../../../components/maps/EnhancedMapView';
import { SearchProvider } from '../../../contexts/SearchContext';
import { useTheme } from 'next-themes';

// Mock the EnhancedProviderMap component
jest.mock('../../../components/maps/EnhancedProviderMap', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ providers, isDarkMode, center, zoom }) => (
      <div data-testid="enhanced-provider-map">
        <div data-testid="provider-count">{providers.length}</div>
        <div data-testid="dark-mode">{isDarkMode.toString()}</div>
        <div data-testid="center">{JSON.stringify(center)}</div>
        <div data-testid="zoom">{zoom}</div>
      </div>
    ))
  };
});

// Mock the next-themes hook
jest.mock('next-themes', () => ({
  useTheme: jest.fn()
}));

// Mock the SearchContext
jest.mock('../../../contexts/SearchContext', () => {
  const originalModule = jest.requireActual('../../../contexts/SearchContext');
  
  return {
    ...originalModule,
    useSearch: jest.fn()
  };
});

describe('EnhancedMapView Component', () => {
  const { useSearch } = require('../../../contexts/SearchContext');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default theme mock
    (useTheme as jest.Mock).mockReturnValue({
      resolvedTheme: 'light'
    });
  });

  test('renders loading state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: true,
      error: null,
      searchFilters: {
        location: null,
        radius: 10
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check for loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders error state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: 'Failed to load map data',
      searchFilters: {
        location: null,
        radius: 10
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check for error message
    expect(screen.getByText('Failed to load map data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  test('renders empty results state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
      searchFilters: {
        location: null,
        radius: 10
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check for empty results message
    expect(screen.getByText('No providers found on the map')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
  });

  test('renders map with providers', () => {
    const mockProviders = [
      {
        id: 1,
        businessName: 'Hair Studio',
        latitude: 40.7128,
        longitude: -74.0060,
        averageRating: 4.5,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          profilePhoto: '/profile1.jpg'
        },
        services: [
          { id: 101, name: 'Haircut', price: 30 }
        ]
      },
      {
        id: 2,
        businessName: 'Nail Salon',
        latitude: 40.7580,
        longitude: -73.9855,
        averageRating: 4.0,
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          profilePhoto: '/profile2.jpg'
        },
        services: [
          { id: 201, name: 'Manicure', price: 25 }
        ]
      }
    ];
    
    useSearch.mockReturnValue({
      searchResults: mockProviders,
      loading: false,
      error: null,
      searchFilters: {
        location: { lat: 40.7128, lng: -74.0060 },
        radius: 10
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check that the map is rendered with the correct props
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();
    expect(screen.getByTestId('provider-count')).toHaveTextContent('2');
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('false');
    
    // Check that the center is calculated correctly (average of provider locations)
    const centerJson = screen.getByTestId('center').textContent;
    const center = JSON.parse(centerJson || '{}');
    expect(center.lat).toBeCloseTo(40.7354, 4); // Average of 40.7128 and 40.7580
    expect(center.lng).toBeCloseTo(-73.99575, 4); // Average of -74.0060 and -73.9855
    
    // Check that the zoom is set based on the radius
    expect(screen.getByTestId('zoom')).toHaveTextContent('13');
  });

  test('uses dark mode when theme is dark', () => {
    // Mock dark theme
    (useTheme as jest.Mock).mockReturnValue({
      resolvedTheme: 'dark'
    });
    
    useSearch.mockReturnValue({
      searchResults: [
        {
          id: 1,
          businessName: 'Hair Studio',
          latitude: 40.7128,
          longitude: -74.0060,
          averageRating: 4.5,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            profilePhoto: '/profile1.jpg'
          },
          services: [
            { id: 101, name: 'Haircut', price: 30 }
          ]
        }
      ],
      loading: false,
      error: null,
      searchFilters: {
        location: { lat: 40.7128, lng: -74.0060 },
        radius: 10
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check that dark mode is enabled
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('true');
  });

  test('calculates zoom level based on search radius', () => {
    useSearch.mockReturnValue({
      searchResults: [
        {
          id: 1,
          businessName: 'Hair Studio',
          latitude: 40.7128,
          longitude: -74.0060,
          averageRating: 4.5,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            profilePhoto: '/profile1.jpg'
          },
          services: [
            { id: 101, name: 'Haircut', price: 30 }
          ]
        }
      ],
      loading: false,
      error: null,
      searchFilters: {
        location: { lat: 40.7128, lng: -74.0060 },
        radius: 2 // Small radius should result in higher zoom
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check that zoom is higher for smaller radius
    expect(screen.getByTestId('zoom')).toHaveTextContent('15');
    
    // Cleanup
    jest.clearAllMocks();
    
    // Test with larger radius
    useSearch.mockReturnValue({
      searchResults: [
        {
          id: 1,
          businessName: 'Hair Studio',
          latitude: 40.7128,
          longitude: -74.0060,
          averageRating: 4.5,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            profilePhoto: '/profile1.jpg'
          },
          services: [
            { id: 101, name: 'Haircut', price: 30 }
          ]
        }
      ],
      loading: false,
      error: null,
      searchFilters: {
        location: { lat: 40.7128, lng: -74.0060 },
        radius: 50 // Large radius should result in lower zoom
      }
    });
    
    render(<EnhancedMapView />);
    
    // Check that zoom is lower for larger radius
    expect(screen.getByTestId('zoom')).toHaveTextContent('10');
  });
});

