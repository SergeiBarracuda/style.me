describe('Search and Discovery Feature', () => {
  beforeEach(() => {
    // Mock the geolocation API
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
        return cb({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });
      });
    });
    
    // Visit the search page
    cy.visit('/search');
  });

  it('should display the search form and intro section on initial load', () => {
    // Check that the search form is displayed
    cy.get('h1').should('contain', 'Find Beauty Services Near You');
    cy.get('input[type="radio"][value="location"]').should('be.checked');
    cy.get('input[type="radio"][value="current"]').should('be.checked');
    cy.get('button').contains('Search').should('exist');
    
    // Check that the intro section is displayed
    cy.get('h2').should('contain', 'Welcome to Beauty Service Marketplace');
    cy.get('h3').should('contain', 'Featured Providers');
    cy.get('h3').should('contain', 'How It Works');
  });

  it('should search for providers by current location', () => {
    // Intercept the search API call
    cy.intercept('GET', '/api/search/providers*', {
      statusCode: 200,
      body: [
        {
          id: 1,
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
            { id: 101, name: 'Haircut', price: 30, duration: 30 }
          ],
          availableTimes: ['10:00 AM', '2:00 PM']
        },
        {
          id: 2,
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
            { id: 102, name: 'Manicure', price: 25, duration: 30 }
          ],
          availableTimes: ['11:00 AM', '3:00 PM']
        }
      ]
    }).as('searchProviders');
    
    // Click the search button
    cy.get('button').contains('Search').click();
    
    // Wait for the API call to complete
    cy.wait('@searchProviders');
    
    // Check that the map view is displayed by default
    cy.get('[data-testid="enhanced-provider-map"]').should('exist');
    
    // Check that the view toggle is displayed
    cy.get('button').contains('List').should('exist');
    cy.get('button').contains('Map').should('exist');
    
    // Switch to list view
    cy.get('button').contains('List').click();
    
    // Check that the list view is displayed
    cy.get('h2').should('contain', '2 Providers Found');
    cy.get('h3').should('contain', 'Hair Studio');
    cy.get('h3').should('contain', 'Nail Salon');
    
    // Check provider details
    cy.contains('John Doe').should('exist');
    cy.contains('4.5').should('exist');
    cy.contains('1.2 miles away').should('exist');
    cy.contains('Haircut - $30.00').should('exist');
    
    // Check that view profile links exist
    cy.get('a').contains('View Profile').should('have.length', 2);
  });

  it('should search for providers by entered location', () => {
    // Intercept the geocoding API call
    cy.intercept('GET', 'https://maps.googleapis.com/maps/api/geocode*', {
      statusCode: 200,
      body: {
        results: [
          {
            geometry: {
              location: {
                lat: 34.0522,
                lng: -118.2437
              }
            },
            formatted_address: 'Los Angeles, CA, USA'
          }
        ],
        status: 'OK'
      }
    }).as('geocode');
    
    // Intercept the search API call
    cy.intercept('GET', '/api/search/providers*', {
      statusCode: 200,
      body: [
        {
          id: 3,
          businessName: 'LA Hair Studio',
          latitude: 34.0522,
          longitude: -118.2437,
          averageRating: 4.7,
          reviewCount: 56,
          distance: 0.8,
          user: {
            firstName: 'Michael',
            lastName: 'Johnson',
            profilePhoto: '/profile3.jpg'
          },
          services: [
            { id: 103, name: 'Haircut', price: 40, duration: 30 }
          ],
          availableTimes: ['9:00 AM', '1:00 PM']
        }
      ]
    }).as('searchProviders');
    
    // Select "Enter location" option
    cy.get('input[type="radio"][value="custom"]').click();
    
    // Enter a location
    cy.get('input[placeholder="Enter city, address, or zip code"]').type('Los Angeles');
    
    // Click the search button
    cy.get('button').contains('Search').click();
    
    // Wait for the API calls to complete
    cy.wait('@geocode');
    cy.wait('@searchProviders');
    
    // Switch to list view
    cy.get('button').contains('List').click();
    
    // Check that the list view is displayed with the new results
    cy.get('h2').should('contain', '1 Providers Found');
    cy.get('h3').should('contain', 'LA Hair Studio');
    
    // Check provider details
    cy.contains('Michael Johnson').should('exist');
    cy.contains('4.7').should('exist');
    cy.contains('0.8 miles away').should('exist');
  });

  it('should search for services by keyword', () => {
    // Intercept the search API call
    cy.intercept('GET', '/api/search/services*', {
      statusCode: 200,
      body: [
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
          id: 102,
          name: 'Hair Coloring',
          price: 60,
          duration: 60,
          description: 'Full hair coloring service',
          category: 'Hair',
          imageUrl: '/hair-color.jpg',
          provider: {
            id: 1,
            businessName: 'Hair Studio',
            averageRating: 4.5,
            user: {
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        }
      ]
    }).as('searchServices');
    
    // Select "Service" search type
    cy.get('input[type="radio"][value="service"]').click();
    
    // Enter a keyword
    cy.get('input[placeholder="Hair styling, nail salon, etc."]').type('hair');
    
    // Click the search button
    cy.get('button').contains('Search').click();
    
    // Wait for the API call to complete
    cy.wait('@searchServices');
    
    // Switch to list view (if not already in list view)
    cy.get('button').contains('List').click();
    
    // Check that the list view is displayed with the service results
    cy.get('h2').should('contain', '2 Services Found');
    cy.get('h3').should('contain', 'Haircut');
    cy.get('h3').should('contain', 'Hair Coloring');
    
    // Check service details
    cy.contains('$30.00').should('exist');
    cy.contains('(30 min)').should('exist');
    cy.contains('Professional haircut with wash and style').should('exist');
    cy.contains('Hair Studio').should('exist');
    
    // Check that book now buttons exist
    cy.get('a').contains('Book Now').should('have.length', 2);
  });

  it('should apply filters to search results', () => {
    // Intercept the initial search API call
    cy.intercept('GET', '/api/search/providers*', {
      statusCode: 200,
      body: [
        {
          id: 1,
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
            { id: 101, name: 'Haircut', price: 30, duration: 30 }
          ],
          availableTimes: ['10:00 AM', '2:00 PM']
        },
        {
          id: 2,
          businessName: 'Nail Salon',
          latitude: 40.7580,
          longitude: -73.9855,
          averageRating: 3.5,
          reviewCount: 28,
          distance: 2.5,
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            profilePhoto: '/profile2.jpg'
          },
          services: [
            { id: 102, name: 'Manicure', price: 25, duration: 30 }
          ],
          availableTimes: ['11:00 AM', '3:00 PM']
        }
      ]
    }).as('initialSearch');
    
    // Intercept the filtered search API call
    cy.intercept('GET', '/api/search/providers*category=Hair*', {
      statusCode: 200,
      body: [
        {
          id: 1,
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
            { id: 101, name: 'Haircut', price: 30, duration: 30 }
          ],
          availableTimes: ['10:00 AM', '2:00 PM']
        }
      ]
    }).as('filteredSearch');
    
    // Click the search button for initial results
    cy.get('button').contains('Search').click();
    
    // Wait for the initial API call to complete
    cy.wait('@initialSearch');
    
    // Switch to list view
    cy.get('button').contains('List').click();
    
    // Check that both providers are displayed
    cy.get('h2').should('contain', '2 Providers Found');
    
    // Select a category filter
    cy.get('select').contains('Service category').parent().select('Hair');
    
    // Apply the filters
    cy.get('button').contains('Apply Filters').click();
    
    // Wait for the filtered API call to complete
    cy.wait('@filteredSearch');
    
    // Check that only the Hair Studio is displayed
    cy.get('h2').should('contain', '1 Providers Found');
    cy.get('h3').should('contain', 'Hair Studio');
    cy.get('h3').should('not.contain', 'Nail Salon');
  });

  it('should handle errors gracefully', () => {
    // Intercept the search API call with an error
    cy.intercept('GET', '/api/search/providers*', {
      statusCode: 500,
      body: {
        error: 'Internal server error'
      }
    }).as('searchError');
    
    // Click the search button
    cy.get('button').contains('Search').click();
    
    // Wait for the API call to complete
    cy.wait('@searchError');
    
    // Check that an error message is displayed
    cy.contains('Failed to load search results').should('exist');
    cy.get('button').contains('Retry').should('exist');
    
    // Intercept the retry API call with success
    cy.intercept('GET', '/api/search/providers*', {
      statusCode: 200,
      body: [
        {
          id: 1,
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
            { id: 101, name: 'Haircut', price: 30, duration: 30 }
          ],
          availableTimes: ['10:00 AM', '2:00 PM']
        }
      ]
    }).as('retrySearch');
    
    // Click the retry button
    cy.get('button').contains('Retry').click();
    
    // Wait for the retry API call to complete
    cy.wait('@retrySearch');
    
    // Check that the results are displayed
    cy.get('button').contains('List').click();
    cy.get('h2').should('contain', '1 Providers Found');
  });
});

