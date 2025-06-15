import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchForm from '../../../components/search/SearchForm';
import { SearchProvider } from '../../../contexts/SearchContext';
import * as mapsUtils from '../../../lib/maps';

// Mock the SearchContext
jest.mock('../../../contexts/SearchContext', () => {
  const originalModule = jest.requireActual('../../../contexts/SearchContext');
  
  return {
    ...originalModule,
    useSearch: () => ({
      searchProvidersByLocation: jest.fn().mockResolvedValue([]),
      searchServicesByKeyword: jest.fn().mockResolvedValue([]),
      categories: ['Hair', 'Nails', 'Makeup', 'Spa'],
      searchFilters: {
        location: null,
        category: null,
        keyword: '',
        radius: 10
      },
      loading: false
    })
  };
});

// Mock the maps utility functions
jest.mock('../../../lib/maps', () => ({
  getUserLocation: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.0060 })
}));

describe('SearchForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search form with all inputs', () => {
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Check for search type radio buttons
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    
    // Check for location options (default view)
    expect(screen.getByText('Use my current location')).toBeInTheDocument();
    expect(screen.getByText('Enter location')).toBeInTheDocument();
    
    // Check for radius slider
    expect(screen.getByText(/Search radius:/)).toBeInTheDocument();
    
    // Check for category dropdown
    expect(screen.getByText('Service category')).toBeInTheDocument();
    
    // Check for search button
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  test('toggles between location and service search', () => {
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Initially in location search mode
    expect(screen.getByText('Use my current location')).toBeInTheDocument();
    
    // Switch to service search
    fireEvent.click(screen.getByLabelText('Service'));
    
    // Should now show keyword input
    expect(screen.getByPlaceholderText('Hair styling, nail salon, etc.')).toBeInTheDocument();
    
    // Location options should be hidden
    expect(screen.queryByText('Use my current location')).not.toBeInTheDocument();
    
    // Switch back to location search
    fireEvent.click(screen.getByLabelText('Location'));
    
    // Location options should be visible again
    expect(screen.getByText('Use my current location')).toBeInTheDocument();
  });

  test('toggles between current location and custom location', () => {
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Initially set to use current location
    expect(screen.queryByPlaceholderText('Enter city, address, or zip code')).not.toBeInTheDocument();
    
    // Switch to custom location
    fireEvent.click(screen.getByLabelText('Enter location'));
    
    // Should now show location input
    expect(screen.getByPlaceholderText('Enter city, address, or zip code')).toBeInTheDocument();
    
    // Switch back to current location
    fireEvent.click(screen.getByLabelText('Use my current location'));
    
    // Location input should be hidden again
    expect(screen.queryByPlaceholderText('Enter city, address, or zip code')).not.toBeInTheDocument();
  });

  test('submits form with location search', async () => {
    const { useSearch } = require('../../../contexts/SearchContext');
    const mockSearchProvidersByLocation = jest.fn().mockResolvedValue([]);
    
    useSearch.mockImplementation(() => ({
      searchProvidersByLocation: mockSearchProvidersByLocation,
      searchServicesByKeyword: jest.fn().mockResolvedValue([]),
      categories: ['Hair', 'Nails', 'Makeup', 'Spa'],
      searchFilters: {
        location: null,
        category: null,
        keyword: '',
        radius: 10
      },
      loading: false
    }));
    
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Submit the form
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
  });

  test('submits form with keyword search', async () => {
    const { useSearch } = require('../../../contexts/SearchContext');
    const mockSearchServicesByKeyword = jest.fn().mockResolvedValue([]);
    
    useSearch.mockImplementation(() => ({
      searchProvidersByLocation: jest.fn().mockResolvedValue([]),
      searchServicesByKeyword: mockSearchServicesByKeyword,
      categories: ['Hair', 'Nails', 'Makeup', 'Spa'],
      searchFilters: {
        location: null,
        category: null,
        keyword: '',
        radius: 10
      },
      loading: false
    }));
    
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Switch to service search
    fireEvent.click(screen.getByLabelText('Service'));
    
    // Enter a keyword
    fireEvent.change(screen.getByPlaceholderText('Hair styling, nail salon, etc.'), {
      target: { value: 'haircut' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    // Wait for the API call
    await waitFor(() => {
      expect(mockSearchServicesByKeyword).toHaveBeenCalledWith('haircut');
    });
  });

  test('shows loading state during search', () => {
    const { useSearch } = require('../../../contexts/SearchContext');
    
    useSearch.mockImplementation(() => ({
      searchProvidersByLocation: jest.fn().mockResolvedValue([]),
      searchServicesByKeyword: jest.fn().mockResolvedValue([]),
      categories: ['Hair', 'Nails', 'Makeup', 'Spa'],
      searchFilters: {
        location: null,
        category: null,
        keyword: '',
        radius: 10
      },
      loading: true // Set loading to true
    }));
    
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Check that the search button shows loading state
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
  });

  test('handles geolocation error', async () => {
    // Mock geolocation to throw an error
    mapsUtils.getUserLocation.mockRejectedValue(new Error('Geolocation error'));
    
    render(
      <SearchProvider>
        <SearchForm />
      </SearchProvider>
    );
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/Unable to get your location/)).toBeInTheDocument();
    });
  });
});

