// Authentication utility for client-side components
export class ClientAuth {
  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always include cookies for fallback authentication
    });
  }

  static async testAuthentication(userId: string) {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/channels/${userId}/stats`);
      return {
        success: response.ok,
        status: response.status,
        data: response.ok ? await response.json() : null
      };
    } catch (error) {
      return {
        success: false,
        status: 'Network Error',
        error: error.message
      };
    }
  }

  static async fetchAnalytics(userId: string, period: string = '28d', metric: string = 'overview') {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/analytics/channel?period=${period}&metric=${metric}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Analytics fetch error:', error);
      throw error;
    }
  }

  static async fetchSubscribersAnalytics(userId: string, period: string = '28d', metric: string = 'overview') {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/api/analytics/subscribers?period=${period}&metric=${metric}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('Subscribers analytics fetch error:', error);
      throw error;
    }
  }

  static getTokenStatus() {
    const token = localStorage.getItem('token');
    return {
      hasToken: !!token,
      token: token ? token.substring(0, 50) + '...' : null
    };
  }

  static clearToken() {
    localStorage.removeItem('token');
  }
}
