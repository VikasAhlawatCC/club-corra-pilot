import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - include Nest global prefix `/api/v1`
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.4:3001';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/api/v1')
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`;

// API Response interface
interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Service class
export class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {
    this.loadTokens();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Load tokens from storage
  private async loadTokens() {
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      this.refreshToken = await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  // Save tokens to storage
  private async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  // Clear tokens
  async clearTokens() {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Get auth headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && this.refreshToken) {
          // Try to refresh token
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request
            return this.request(endpoint, options);
          }
        }

        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveTokens(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }

    // Clear tokens if refresh failed
    await this.clearTokens();
    return false;
  }

  // Authentication methods
  async signup(signupData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  async requestOtp(requestData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async verifyOtp(verifyData: any): Promise<ApiResponse<any>> {
    const response = await this.request<ApiResponse<any>>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData),
    });

    // Save tokens if verification successful
    if (response.success && response.data?.tokens) {
      await this.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response;
  }

  async mobileLogin(loginData: any): Promise<ApiResponse<any>> {
    const response = await this.request<ApiResponse<any>>('/auth/login/mobile', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });

    // Save tokens if login successful
    if (response.success && response.data?.tokens) {
      await this.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response;
  }

  // User profile methods
  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updatePaymentDetails(paymentData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/users/payment-details', {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  // Welcome bonus methods
  async processWelcomeBonus(userId: string, mobileNumber: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/welcome-bonus', {
      method: 'POST',
      body: JSON.stringify({ userId, mobileNumber }),
    });
  }

  // Brand methods
  async getBrands(searchParams?: any): Promise<ApiResponse<any>> {
    const queryString = searchParams ? `?${new URLSearchParams(searchParams)}` : '';
    return this.request<ApiResponse<any>>(`/brands${queryString}`);
  }

  async getBrandById(brandId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/brands/${brandId}`);
  }

  // Coin/Transaction methods
  async getCoinBalance(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/coins/balance');
  }

  async getTransactions(searchParams?: any): Promise<ApiResponse<any>> {
    const queryString = searchParams ? `?${new URLSearchParams(searchParams)}` : '';
    return this.request<ApiResponse<any>>(`/coins/transactions${queryString}`);
  }

  async createEarnTransaction(transactionData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/coins/transactions/earn', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async createRedeemTransaction(transactionData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/coins/transactions/redeem', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  // Generic HTTP methods
  async get<T>(endpoint: string, config?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  async post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...config,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...config,
    });
  }

  async delete<T>(endpoint: string, config?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
