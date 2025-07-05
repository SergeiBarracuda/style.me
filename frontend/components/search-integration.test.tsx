import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedSearchPage from '../../components/search/EnhancedSearchPage';
import * as SearchContextModule from '../../contexts/SearchContext';
import * as mapsUtils from '../../lib/maps';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt} />;
  },
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock the next-themes hook
jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light'
  })
}));

// Mock the GoogleMapProvider component
jest.mock('../../components/maps/GoogleMapProvider', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="google-map-provider">{children}</div>
  };
});

// Mock the EnhancedProviderMap component
jest.mock('../../components/maps/EnhancedProviderMap', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ providers }) => (
      <div data-testid="enhanced-provider-map">
        <div data-testid="provider-count">{providers.length}</div>
        <ul>
          {providers.map(provider => (
            <li key={provider.id} data-testid={`map-provider-${provider.id}`}>
              {provider.name}
            </li>
          ))}
        </ul>
      </div>
    ))
  };
});

// Mock the maps utility functions
jest.mock('../../lib/maps', () => ({
  getUserLocation: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.0060 }),
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.0060 },
  DEFAULT_ZOOM: 13,
  LIGHT_MODE_STYLES: [],
  DARK_MODE_STYLES: []
}));

describe('Search Integration Tests', () => {
  // Mock data
  const mockCategories = ['Hair', 'Nails', 'Makeup', 'Spa'];

  const mockFeaturedProviders = [
    {
      id: 1,
      businessName: 'Featured Hair Studio',
      averageRating: 4.8,
      user: {
        firstName: 'John',
        lastName: 'Featured',
        profilePhoto: '/profile1.jpg'
      },
      services: [
        { id: 101, name: 'Premium Haircut', price: 50 }
      ]
    }
  ];

  const mockSearchResults = [
    {
      id: 2,
      businessName: 'Hair Studio',
      latitude: 40.7128,
      longitude: -74.0060,
      averageRating: 4.5,
      reviewCount: 42,
      distance: 1.2,
      user: {
        firstName: 'John',
        lastName: 'Doe',
        profilePhoto: '/profile1.jpg'
      },
      services: [
        { id: 102, name: 'Haircut', price: 30, duration: 30 }
      ],
      availableTimes: ['10:00 AM', '2:00 PM']
    },
    {
      id: 3,
      businessName: 'Nail Salon',
      latitude: 40.7580,
      longitude: -73.9855,
      averageRating: 4.0,
      reviewCount: 28,
      distance: 2.5,
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        profilePhoto: '/profile2.jpg'
      },
      services: [
        { id: 103, name: 'Manicure', price: 25, duration: 30 }
      ],
      availableTimes: ['11:00 AM', '3:00 PM']
    }
  ];

  // Mock the SearchProvider component
  const mockSearchProvidersByLocation = jest.fn().mockResolvedValue(mockSearchResults);
  const mockSearchServicesByKeyword = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a spy on the SearchProvider component
    jest.spyOn(SearchContextModule, 'SearchProvider').mockImplementation(({ children }) => {
      return (
        <SearchContextModule.SearchContext.Provider
          value={{
            searchResults: [],
            loading: false,
            error: null,
            categories: mockCategories,
            featuredProviders: mockFeaturedProviders,
            popularServices: [],
            searchFilters: {
              location: null,
              category: null,
              keyword: '',
              radius: 10
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn()
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      );
    });
  });

  test('initial render shows intro section with featured providers', () => {
    render(<EnhancedSearchPage />);

    // Check for intro section
    expect(screen.getByText('Welcome to Beauty Service Marketplace')).toBeInTheDocument();

    // Check for featured providers
    expect(screen.getByText('Featured Providers')).toBeInTheDocument();
    expect(screen.getByText('Featured Hair Studio')).toBeInTheDocument();

    // Check that view toggle is not shown initially
    expect(screen.queryByText('List')).not.toBeInTheDocument();
    expect(screen.queryByText('Map')).not.toBeInTheDocument();
  });

  test('search form submission triggers location search and updates results', async () => {
    // Update the mock to return search results
    const updatedSearchProvider = jest.spyOn(SearchContextModule, 'SearchProvider');

    // First render with empty results
    const { rerender } = render(<EnhancedSearchPage />);

    // Submit the search form
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Wait for the geolocation and API call
    await waitFor(() => {
      expect(mapsUtils.getUserLocation).toHaveBeenCalled();
      expect(mockSearchProvidersByLocation).toHaveBeenCalledWith(
        40.7128, // Latitude from mocked getUserLocation
        -74.0060, // Longitude from mocked getUserLocation
        10, // Default radius
        null // No category selected
      );
    });

    // Update the mock to return search results
    updatedSearchProvider.mockImplementation(({ children }) => {
      return (
        <SearchContextModule.SearchContext.Provider
          value={{
            searchResults: mockSearchResults,
            loading: false,
            error: null,
            categories: mockCategories,
            featuredProviders: mockFeaturedProviders,
            popularServices: [],
            searchFilters: {
              location: { lat: 40.7128, lng: -74.0060 },
              category: null,
              keyword: '',
              radius: 10
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn()
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      );
    });

    // Re-render with search results
    rerender(<EnhancedSearchPage />);

    // Check that view toggle is now shown
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();

    // Check that map view is shown by default
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();
    expect(screen.getByTestId('provider-count')).toHaveTextContent('2');

    // Check that providers are shown on the map
    expect(screen.getByTestId('map-provider-2')).toHaveTextContent('Hair Studio');
    expect(screen.getByTestId('map-provider-3')).toHaveTextContent('Nail Salon');
  });

  test('view toggle switches between map and list views', async () => {
    // Mock with search results
    jest.spyOn(SearchContextModule, 'SearchProvider').mockImplementation(({ children }: { children: React.ReactNode }) => {
      return (
        <SearchContextModule.SearchContext.Provider
          value={{
            searchResults: mockSearchResults,
            loading: false,
            error: null,
            categories: mockCategories,
            featuredProviders: mockFeaturedProviders,
            popularServices: [],
            searchFilters: {
              location: { lat: 40.7128, lng: -74.0060 },
              category: null,
              keyword: '',
              radius: 10
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn()
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      );
    });

    render(<EnhancedSearchPage />);

    // Check that map view is shown by default
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();

    // Click the list view toggle
    fireEvent.click(screen.getByText('List'));

    // Check that list view is now shown
    expect(screen.queryByTestId('enhanced-provider-map')).not.toBeInTheDocument();
    expect(screen.getByText('2 Providers Found')).toBeInTheDocument();

    // Check that providers are shown in the list
    expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    expect(screen.getByText('Nail Salon')).toBeInTheDocument();

    // Click the map view toggle
    fireEvent.click(screen.getByText('Map'));

    // Check that map view is shown again
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();
  });

  test('applying filters triggers new search with filter parameters', async () => {
    // Mock with search results and filters
    jest.spyOn(SearchContextModule, 'SearchProvider').mockImplementation(({ children }) => {
      return (
        <SearchContextModule.SearchContext.Provider
          value={{
            searchResults: mockSearchResults,
            loading: false,
            error: null,
            categories: mockCategories,
            featuredProviders: mockFeaturedProviders,
            popularServices: [],
            searchFilters: {
              location: { lat: 40.7128, lng: -74.0060 },
              category: null,
              keyword: '',
              radius: 10
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn()
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      );
    });

    render(<EnhancedSearchPage />);

    // Select a category filter
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Hair' }
    });

    // Click the apply filters button
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

    // Wait for the API call
    await waitFor(() => {
      expect(mockSearchProvidersByLocation).toHaveBeenCalledWith(
        40.7128, // Latitude
        -74.0060, // Longitude
        10, // Radius
        'Hair', // Category
        expect.any(Object) // Additional filters
      );
    });
  });
});
