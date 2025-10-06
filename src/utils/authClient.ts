// Authentication utility functions for client-side use
export class AuthUtils {
  /**
   * Check if user is authenticated by making a request to /api/auth/me
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
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
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.user;
      }
      return null;
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
   * @param options - fetch options
   * @returns Promise<Response>
   */
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

