import type { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedSearchPage from '../search/EnhancedSearchPage';
import * as SearchContextModule from '../../contexts/SearchContext';
import * as mapsUtils from '../../lib/maps';
/** Mock for next/image */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

/** Mock for next/link */
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

/** Mock next-themes */
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

/** Mock GoogleMapProvider */
jest.mock('../../components/maps/GoogleMapProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="google-map-provider">{children}</div>
  ),
}));

/** Interfaces for mock data */
interface MockUser {
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

interface MockService {
  id: number;
  name: string;
  price: number;
  duration?: number;
}

interface MockProvider {
  id: number;
  businessName: string;
  latitude?: number;
  longitude?: number;
  averageRating: number;
  reviewCount?: number;
  distance?: number;
  user: MockUser;
  services: MockService[];
  availableTimes?: string[];
}

/** Mock for EnhancedProviderMap */
jest.mock('../../components/maps/EnhancedProviderMap', () => ({
  __esModule: true,
  default: jest
    .fn()
    .mockImplementation(
      ({ providers }: { providers: Array<{ id: number; name: string }> }) => (
        <div data-testid="enhanced-provider-map">
          <div data-testid="provider-count">{providers.length}</div>
          <ul>
            {providers.map((provider) => (
              <li key={provider.id} data-testid={`map-provider-${provider.id}`}>
                {provider.name}
              </li>
            ))}
          </ul>
        </div>
      )
    ),
}));

/** Mock maps lib */
jest.mock('../../lib/maps', () => ({
  getUserLocation: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.0060 }),
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.0060 },
  DEFAULT_ZOOM: 13,
  LIGHT_MODE_STYLES: [],
  DARK_MODE_STYLES: [],
}));

describe('Search Integration Tests', () => {
  const mockCategories: string[] = ['Hair', 'Nails', 'Makeup', 'Spa'];

  const mockFeaturedProviders: MockProvider[] = [
    {
      id: 1,
      businessName: 'Featured Hair Studio',
      averageRating: 4.8,
      user: {
        firstName: 'John',
        lastName: 'Featured',
        profilePhoto: '/profile1.jpg',
      },
      services: [{ id: 101, name: 'Premium Haircut', price: 50 }],
    },
  ];

  const mockSearchResults: MockProvider[] = [
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
        profilePhoto: '/profile1.jpg',
      },
      services: [{ id: 102, name: 'Haircut', price: 30, duration: 30 }],
      availableTimes: ['10:00 AM', '2:00 PM'],
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
        profilePhoto: '/profile2.jpg',
      },
      services: [{ id: 103, name: 'Manicure', price: 25, duration: 30 }],
      availableTimes: ['11:00 AM', '3:00 PM'],
    },
  ];

  const mockSearchProvidersByLocation = jest
    .fn()
    .mockResolvedValue(mockSearchResults);
  const mockSearchServicesByKeyword = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(SearchContextModule, 'SearchProvider')
      .mockImplementation(({ children }: { children: ReactNode }) => (
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
              radius: 10,
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn(),
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      ));
  });

  test('initial render shows intro section with featured providers', () => {
    render(<EnhancedSearchPage />);
    expect(
      screen.getByText('Welcome to Beauty Service Marketplace')
    ).toBeInTheDocument();
    expect(screen.getByText('Featured Providers')).toBeInTheDocument();
    expect(screen.getByText('Featured Hair Studio')).toBeInTheDocument();
    expect(screen.queryByText('List')).not.toBeInTheDocument();
    expect(screen.queryByText('Map')).not.toBeInTheDocument();
  });

  test('search form submission triggers location search and updates results', async () => {
    const updatedSearchProvider = jest.spyOn(SearchContextModule, 'SearchProvider');
    const { rerender } = render(<EnhancedSearchPage />);

    // Click the "Search" button
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(mapsUtils.getUserLocation).toHaveBeenCalled();
      expect(mockSearchProvidersByLocation).toHaveBeenCalledWith(
        40.7128,
        -74.0060,
        10,
        null
      );
    });

    // Now return the search results
    updatedSearchProvider.mockImplementation(({ children }: { children: ReactNode }) => (
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
            radius: 10,
          },
          searchProvidersByLocation: mockSearchProvidersByLocation,
          searchServicesByKeyword: mockSearchServicesByKeyword,
          clearSearchResults: jest.fn(),
        }}
      >
        {children}
      </SearchContextModule.SearchContext.Provider>
    ));

    rerender(<EnhancedSearchPage />);

    // Check toggles and map
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();
    expect(screen.getByTestId('provider-count')).toHaveTextContent('2');
    expect(screen.getByTestId('map-provider-2')).toHaveTextContent('Hair Studio');
    expect(screen.getByTestId('map-provider-3')).toHaveTextContent('Nail Salon');
  });

  test('view toggle switches between map and list views', async () => {
    jest
      .spyOn(SearchContextModule, 'SearchProvider')
      .mockImplementation(({ children }: { children: ReactNode }) => (
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
              radius: 10,
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn(),
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      ));

    render(<EnhancedSearchPage />);
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();

    // Switch to list view
    fireEvent.click(screen.getByText('List'));
    expect(screen.queryByTestId('enhanced-provider-map')).not.toBeInTheDocument();
    expect(screen.getByText('2 Providers Found')).toBeInTheDocument();
    expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    expect(screen.getByText('Nail Salon')).toBeInTheDocument();

    // Switch back to map view
    fireEvent.click(screen.getByText('Map'));
    expect(screen.getByTestId('enhanced-provider-map')).toBeInTheDocument();
  });

  test('applying filters triggers new search with filter parameters', async () => {
    jest
      .spyOn(SearchContextModule, 'SearchProvider')
      .mockImplementation(({ children }: { children: ReactNode }) => (
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
              radius: 10,
            },
            searchProvidersByLocation: mockSearchProvidersByLocation,
            searchServicesByKeyword: mockSearchServicesByKeyword,
            clearSearchResults: jest.fn(),
          }}
        >
          {children}
        </SearchContextModule.SearchContext.Provider>
      ));

    render(<EnhancedSearchPage />);

    // Change category and click "Apply Filters"
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'Hair' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

    await waitFor(() => {
      expect(mockSearchProvidersByLocation).toHaveBeenCalledWith(
        40.7128, // lat
        -74.0060, // lng
        10, // radius
        'Hair', // category
        expect.any(Object) // possible extra param
      );
    });
  });
});
