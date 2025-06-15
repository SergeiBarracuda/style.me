import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchResults from '../../../components/search/SearchResults';
import { SearchProvider } from '../../../contexts/SearchContext';

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

// Mock the SearchContext
jest.mock('../../../contexts/SearchContext', () => {
  const originalModule = jest.requireActual('../../../contexts/SearchContext');
  
  return {
    ...originalModule,
    useSearch: jest.fn()
  };
});

describe('SearchResults Component', () => {
  const { useSearch } = require('../../../contexts/SearchContext');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: true,
      error: null
    });
    
    render(<SearchResults />);
    
    // Check for loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders error state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: 'Failed to load search results'
    });
    
    render(<SearchResults />);
    
    // Check for error message
    expect(screen.getByText('Failed to load search results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  test('renders empty results state', () => {
    useSearch.mockReturnValue({
      searchResults: [],
      loading: false,
      error: null
    });
    
    render(<SearchResults />);
    
    // Check for empty results message
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
  });

  test('renders provider results', () => {
    const mockProviders = [
      {
        id: 1,
        businessName: 'Hair Studio',
        address: '123 Main St',
        averageRating: 4.5,
        reviewCount: 42,
        distance: 1.2,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          profilePhoto: '/profile1.jpg'
        },
        services: [
          { id: 101, name: 'Haircut', price: 30, duration: 30 },
          { id: 102, name: 'Color', price: 60, duration: 60 }
        ],
        availableTimes: ['10:00 AM', '2:00 PM', '4:00 PM']
      },
      {
        id: 2,
        businessName: 'Nail Salon',
        address: '456 Oak St',
        averageRating: 4.0,
        reviewCount: 28,
        distance: 2.5,
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          profilePhoto: '/profile2.jpg'
        },
        services: [
          { id: 201, name: 'Manicure', price: 25, duration: 30 },
          { id: 202, name: 'Pedicure', price: 35, duration: 45 }
        ],
        availableTimes: ['11:00 AM', '3:00 PM']
      }
    ];
    
    useSearch.mockReturnValue({
      searchResults: mockProviders,
      loading: false,
      error: null
    });
    
    render(<SearchResults />);
    
    // Check for results count
    expect(screen.getByText('2 Providers Found')).toBeInTheDocument();
    
    // Check for provider names
    expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    expect(screen.getByText('Nail Salon')).toBeInTheDocument();
    
    // Check for provider details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check for ratings
    expect(screen.getByText('4.5 (42)')).toBeInTheDocument();
    expect(screen.getByText('4.0 (28)')).toBeInTheDocument();
    
    // Check for addresses and distances
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('1.2 miles away')).toBeInTheDocument();
    
    // Check for services
    expect(screen.getByText('Haircut - $30.00')).toBeInTheDocument();
    expect(screen.getByText('Manicure - $25.00')).toBeInTheDocument();
    
    // Check for available times
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    
    // Check for view profile links
    const links = screen.getAllByText('View Profile');
    expect(links).toHaveLength(2);
    expect(links[0].closest('a')).toHaveAttribute('href', '/provider/1');
    expect(links[1].closest('a')).toHaveAttribute('href', '/provider/2');
  });

  test('renders service results', () => {
    const mockServices = [
      {
        id: 101,
        name: 'Haircut',
        price: 30,
        duration: 30,
        description: 'Professional haircut with wash and style',
        category: 'Hair',
        imageUrl: '/haircut.jpg',
        provider: {
          id: 1,
          businessName: 'Hair Studio',
          averageRating: 4.5,
          user: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      },
      {
        id: 201,
        name: 'Manicure',
        price: 25,
        duration: 30,
        description: 'Classic manicure with polish',
        category: 'Nails',
        imageUrl: '/manicure.jpg',
        provider: {
          id: 2,
          businessName: 'Nail Salon',
          averageRating: 4.0,
          user: {
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      }
    ];
    
    useSearch.mockReturnValue({
      searchResults: mockServices,
      loading: false,
      error: null
    });
    
    render(<SearchResults />);
    
    // Check for results count
    expect(screen.getByText('2 Services Found')).toBeInTheDocument();
    
    // Check for service names
    expect(screen.getByText('Haircut')).toBeInTheDocument();
    expect(screen.getByText('Manicure')).toBeInTheDocument();
    
    // Check for service prices and durations
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('(30 min)')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    
    // Check for service descriptions
    expect(screen.getByText('Professional haircut with wash and style')).toBeInTheDocument();
    expect(screen.getByText('Classic manicure with polish')).toBeInTheDocument();
    
    // Check for provider names
    expect(screen.getByText('Hair Studio')).toBeInTheDocument();
    expect(screen.getByText('Nail Salon')).toBeInTheDocument();
    
    // Check for categories
    expect(screen.getByText('Hair')).toBeInTheDocument();
    expect(screen.getByText('Nails')).toBeInTheDocument();
    
    // Check for book now buttons
    const bookButtons = screen.getAllByText('Book Now');
    expect(bookButtons).toHaveLength(2);
    expect(bookButtons[0].closest('a')).toHaveAttribute('href', '/booking/101');
    expect(bookButtons[1].closest('a')).toHaveAttribute('href', '/booking/201');
  });
});

