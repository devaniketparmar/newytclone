import axios from 'axios';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : '',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    // Add any authentication logic here if needed
    // For example, add token from localStorage or cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config?: any) => {
    return apiClient.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.put(url, data, config);
  },

  patch: <T = any>(url: string, data?: any, config?: any) => {
    return apiClient.patch(url, data, config);
  },

  delete: <T = any>(url: string, config?: any) => {
    return apiClient.delete(url, config);
  },
};

// Export the configured axios instance
export default apiClient;
