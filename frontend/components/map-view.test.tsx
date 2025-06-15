/**
 * Component test for map-view.tsx
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MapView from '../src/app/map-view';
import providerService from '../src/lib/api/providerService';

// Mock the provider service
jest.mock('../src/lib/api/providerService', () => ({
  searchProviders: jest.fn(),
}));

// Mock the next-themes hook
jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

describe('MapView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display loading state initially', () => {
    // Mock the provider service to return a promise that doesn't resolve immediately
    providerService.searchProviders.mockReturnValue(new Promise(() => {}));
    
    render(<MapView filters={{}} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('should display providers when loaded successfully', async () => {
    // Mock successful response
    providerService.searchProviders.mockResolvedValue({
      providers: [
        {
          id: 1,
          businessName: 'Test Salon',
          description: 'A test salon',
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.0060,
          averageRating: 4.5,
          reviewCount: 10,
          user: {
            firstName: 'John',
            lastName: 'Doe',
            profilePhoto: '/test.jpg',
          },
          services: [
            {
              id: 1,
              name: 'Haircut',
              price: 50,
              duration: 60,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
    
    render(<MapView filters={{}} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(providerService.searchProviders).toHaveBeenCalledTimes(1);
    });
    
    // Check that the ProviderMap component is rendered with the correct props
    // Note: We can't directly test the ProviderMap component here as it uses Google Maps
    // which is mocked, but we can verify the component is rendered
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('should display error message when API call fails', async () => {
    // Mock failed response
    providerService.searchProviders.mockRejectedValue(new Error('API error'));
    
    render(<MapView filters={{}} />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load providers/i)).toBeInTheDocument();
    });
    
    // Check for retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('should display empty state when no providers found', async () => {
    // Mock empty response
    providerService.searchProviders.mockResolvedValue({
      providers: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    
    render(<MapView filters={{}} />);
    
    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText(/No providers found/i)).toBeInTheDocument();
    });
  });
});
