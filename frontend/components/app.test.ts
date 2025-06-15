// Test script for beauty marketplace application
// This script will test various functionality of the application

import { test, expect } from '@playwright/test';

// Authentication Tests
test.describe('Authentication', () => {
  test('should allow user to register as a client', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Select client role
    await page.getByLabel('Client').check();
    
    // Fill registration form
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Verify redirect to verification page
    await expect(page).toHaveURL(/\/auth\/verify/);
  });
  
  test('should allow user to register as a service provider', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Select provider role
    await page.getByLabel('Service Provider').check();
    
    // Fill registration form
    await page.getByLabel('Email').fill('test.provider@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Verify redirect to verification page
    await expect(page).toHaveURL(/\/auth\/verify/);
  });
  
  test('should allow user to login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill login form
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify redirect to home page or dashboard
    await expect(page).toHaveURL(/\/(client\/dashboard|)/);
  });
});

// Search and Discovery Tests
test.describe('Search and Discovery', () => {
  test('should allow searching for services', async ({ page }) => {
    await page.goto('/search');
    
    // Enter search query
    await page.getByPlaceholder('Search for services...').fill('haircut');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Verify search results appear
    await expect(page.getByTestId('search-results')).toBeVisible();
    await expect(page.getByTestId('service-provider-card')).toHaveCount.greaterThan(0);
  });
  
  test('should allow filtering search results', async ({ page }) => {
    await page.goto('/search?q=haircut');
    
    // Apply filter
    await page.getByLabel('Price: Low to High').check();
    
    // Verify filtered results
    await expect(page.getByTestId('search-results')).toBeVisible();
  });
  
  test('should toggle between map and list view', async ({ page }) => {
    await page.goto('/search?q=haircut');
    
    // Switch to map view
    await page.getByRole('button', { name: 'Map View' }).click();
    
    // Verify map is visible
    await expect(page.getByTestId('provider-map')).toBeVisible();
    
    // Switch back to list view
    await page.getByRole('button', { name: 'List View' }).click();
    
    // Verify list is visible
    await expect(page.getByTestId('search-results')).toBeVisible();
  });
});

// Booking Tests
test.describe('Booking', () => {
  test('should allow booking a service', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to a provider profile
    await page.goto('/provider/1');
    
    // Click book now
    await page.getByRole('button', { name: 'Book Now' }).click();
    
    // Select service
    await page.getByTestId('service-option').first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Select date and time
    await page.getByTestId('date-picker').getByText('15').click();
    await page.getByTestId('time-slot').first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Enter payment details
    await page.getByLabel('Name on Card').fill('Test User');
    await page.getByLabel('Card Number').fill('4242424242424242');
    await page.getByLabel('Expiry Date').fill('12/25');
    await page.getByLabel('CVC').fill('123');
    
    // Complete booking
    await page.getByRole('button', { name: /Pay \$/ }).click();
    
    // Verify booking confirmation
    await expect(page).toHaveURL(/\/booking\/confirmation/);
    await expect(page.getByText('Booking Confirmed')).toBeVisible();
  });
  
  test('should show booking history', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to bookings page
    await page.goto('/client/bookings');
    
    // Verify bookings are visible
    await expect(page.getByTestId('booking-history')).toBeVisible();
  });
});

// Reviews Tests
test.describe('Reviews', () => {
  test('should allow leaving a review', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to review creation page
    await page.goto('/review/create/bk-001');
    
    // Select rating
    await page.getByTestId('star-rating').getByRole('button').nth(4).click(); // 5 stars
    
    // Enter review text
    await page.getByLabel('Your Review').fill('Excellent service! The stylist was professional and friendly. Highly recommend!');
    
    // Submit review
    await page.getByRole('button', { name: 'Submit Review' }).click();
    
    // Verify success page
    await expect(page).toHaveURL(/\/review\/success/);
    await expect(page.getByText('Review Submitted!')).toBeVisible();
  });
  
  test('should display reviews on provider profile', async ({ page }) => {
    await page.goto('/provider/1');
    
    // Verify reviews section is visible
    await expect(page.getByTestId('reviews-section')).toBeVisible();
    await expect(page.getByTestId('review-card')).toHaveCount.greaterThan(0);
  });
});

// Messaging Tests
test.describe('Messaging', () => {
  test('should allow sending messages', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('test.client@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Navigate to messages page
    await page.goto('/messages');
    
    // Select a conversation
    await page.getByTestId('conversation-item').first().click();
    
    // Type and send a message
    await page.getByPlaceholder('Type a message...').fill('Hello, I have a question about your services.');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Verify message appears in the conversation
    await expect(page.getByText('Hello, I have a question about your services.')).toBeVisible();
  });
});

// Responsive Design Tests
test.describe('Responsive Design', () => {
  test('should display mobile navigation on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Verify mobile navigation is visible
    await expect(page.getByTestId('mobile-nav')).toBeVisible();
    
    // Verify desktop navigation is hidden
    await expect(page.getByTestId('desktop-nav')).not.toBeVisible();
  });
  
  test('should display desktop navigation on large screens', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    
    await page.goto('/');
    
    // Verify desktop navigation is visible
    await expect(page.getByTestId('desktop-nav')).toBeVisible();
    
    // Verify mobile navigation is hidden
    await expect(page.getByTestId('mobile-nav')).not.toBeVisible();
  });
  
  test('should adapt layout on different screen sizes', async ({ page }) => {
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/search');
    
    // Verify mobile layout
    await expect(page.getByTestId('search-results-mobile')).toBeVisible();
    
    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/search');
    
    // Verify desktop layout
    await expect(page.getByTestId('search-results-desktop')).toBeVisible();
  });
});
