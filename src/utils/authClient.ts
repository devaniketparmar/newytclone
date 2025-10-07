import { api } from '../lib/axios';

// Authentication utility functions for client-side use
export class AuthUtils {
  /**
   * Check if user is authenticated by making a request to /api/auth/me
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const response = await api.get('/api/auth/me');
      return response.status === 200;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Get current user data
   * @returns Promise<any> - user data or null if not authenticated
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      const response = await api.get('/api/auth/me');
      return response.data.data.user;
    } catch (error) {
      console.error('Get user failed:', error);
      return null;
    }
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }

  /**
   * Make authenticated API request
   * @param url - API endpoint URL
   * @param options - axios options
   * @returns Promise<AxiosResponse>
   */
  static async authenticatedRequest(url: string, options: any = {}) {
    return api.get(url, options);
  }
}

