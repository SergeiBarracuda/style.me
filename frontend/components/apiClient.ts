/**
 * API Client for making requests to the backend
 */

// Base URL for API requests - would typically come from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Helper function to get auth token from storage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  // Check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    } catch (e) {
      // If parsing fails, throw generic error with status
      throw new Error(`API error: ${response.status}`);
    }
  }

  // For 204 No Content responses, return null
  if (response.status === 204) {
    return null;
  }

  // Parse and return JSON response
  return response.json();
};

// Main API client object
const apiClient = {
  /**
   * Make a GET request to the API
   * @param endpoint - API endpoint to call
   * @param params - Query parameters
   * @param requireAuth - Whether the request requires authentication
   */
  async get(endpoint: string, params: Record<string, any> = {}, requireAuth = false) {
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }    });

    // Prepare headers
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    // Add auth token if required
    if (requireAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    return handleResponse(response);
  },

  /**
   * Make a POST request to the API
   * @param endpoint - API endpoint to call
   * @param data - Request body data
   * @param requireAuth - Whether the request requires authentication
   */  async post(endpoint: string, data: any = {}, requireAuth = false) {
    // Prepare headers
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    // Add auth token if required
    if (requireAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Make a PUT request to the API
   * @param endpoint - API endpoint to call
   * @param data - Request body data
   * @param requireAuth - Whether the request requires authentication
   */  async put(endpoint: string, data: any = {}, requireAuth = false) {
    // Prepare headers
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    // Add auth token if required
    if (requireAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Make a DELETE request to the API
   * @param endpoint - API endpoint to call
   * @param requireAuth - Whether the request requires authentication
   */
  async delete(endpoint: string, requireAuth = false) {    // Prepare headers
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    // Add auth token if required
    if (requireAuth) {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return handleResponse(response);
  },
};

export default apiClient;
