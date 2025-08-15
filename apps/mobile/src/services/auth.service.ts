import { User, AuthToken, AuthProvider } from '@shared/types';
import { adaptApiAuthResponse } from '@shared/utils/type-adapter';
import { 
  signupSchema, 
  mobileLoginSchema, 
  oauthLoginSchema,
  authResponseSchema,
  passwordSetupSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} from '@shared/schemas';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Normalize API base URL to include Nest global prefix `/api/v1`
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.5:3001';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/api/v1')
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`;

class AuthService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}/auth/${endpoint}`;
    console.log('[DEBUG] makeRequest called:', { endpoint, url, options });
    
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
          'X-Client-Type': 'mobile',
          'User-Agent': 'ClubCorra-Mobile/1.0.0',
          ...options.headers,
        },
        ...options,
      });

      console.log('[DEBUG] API response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[DEBUG] API error response:', errorData);
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error('Authentication failed. Please log in again.');
          case 403:
            throw new Error('Access denied. You do not have permission to perform this action.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 429:
            throw new Error('Too many requests. Please wait before trying again.');
          case 500:
            throw new Error('Server error. Please try again later.');
          case 503:
            throw new Error('Service temporarily unavailable. Please try again later.');
          default:
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log('[DEBUG] API success response:', responseData);
      return responseData;
    } catch (error) {
      console.log('[DEBUG] makeRequest error:', error);
      
      // Retry logic for network errors and 5xx status codes
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      // If we've exhausted retries or it's not a retryable error, throw
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Make a request to the users endpoint (not auth endpoint)
   * @param endpoint - The endpoint to call (without /users prefix)
   * @param options - Request options
   * @returns Promise with the response data
   */
  private async makeUsersRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}/users/${endpoint}`;
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
    
    try {
      // Get the current access token for authentication
      const tokens = await this.getStoredTokens();
      if (!tokens?.accessToken) {
        throw new Error('No access token available. Please log in again.');
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-Platform': 'mobile',
          'X-Client-Type': 'mobile',
          'User-Agent': 'ClubCorra-Mobile/1.0.0',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error('Authentication failed. Please log in again.');
          case 403:
            throw new Error('Access denied. You do not have permission to perform this action.');
          case 404:
            throw new Error('The requested resource was not found.');
          case 429:
            throw new Error('Too many requests. Please wait before trying again.');
          case 500:
            throw new Error('Server error. Please try again later.');
          case 503:
            throw new Error('Service temporarily unavailable. Please try again later.');
          default:
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      // Retry logic for network errors and 5xx status codes
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.makeUsersRequest<T>(endpoint, options, retryCount + 1);
      }
      
      // If we've exhausted retries or it's not a retryable error, throw
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Determine if a request should be retried
   * @param error - The error that occurred
   * @returns Boolean indicating if the request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or server errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    
    // Retry on specific error messages that indicate temporary issues
    if (error instanceof Error) {
      const retryableMessages = [
        'Server error',
        'Service temporarily unavailable',
        'Network error',
        'Connection failed'
      ];
      
      return retryableMessages.some(message => 
        error.message.includes(message)
      );
    }
    
    return false;
  }

  async initiateSignup(signupData: any): Promise<{ message: string; expiresIn: number }> {
    console.log('[DEBUG] initiateSignup called with:', signupData);
    
    // Two-phase signup support
    // Phase 1 (phone/email only): request OTP
    // Phase 2 (full details): create account via /auth/signup

    // Old format: initiateSignup('9999999999') → request SMS OTP
    if (typeof signupData === 'string') {
      const payload = { mobileNumber: signupData, type: 'SMS' as const };
      console.log('[DEBUG] String format, sending payload:', payload);
      return this.makeRequest('request-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const {
      mobileNumber,
      email,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      authMethod,
    } = signupData || {};

    console.log('[DEBUG] Parsed signup data:', { mobileNumber, email, firstName, lastName });

    // Always request OTP first when mobile number is provided
    // This ensures user gets OTP before account creation
    if (mobileNumber) {
      const payload = { mobileNumber, type: 'SMS' as const };
      console.log('[DEBUG] Mobile number provided, sending OTP request with payload:', payload);
      return this.makeRequest('request-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // If no mobile number but email is provided, request email OTP
    if (email) {
      const payload = { email, type: 'EMAIL' as const };
      console.log('[DEBUG] Email provided, sending OTP request with payload:', payload);
      return this.makeRequest('request-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    throw new Error('Mobile number or email is required to initiate signup');
  }

  async verifyOTP(mobileNumber: string, otp: string): Promise<{ user: User; tokens: AuthToken; expiresIn: number } | { message: string; requiresAdditionalVerification: boolean; user: User }> {
    const payload = {
      mobileNumber,
      code: otp,
      type: 'SMS' as const,
    };

    const response = await this.makeRequest('verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Return the response as-is since the backend format doesn't match the expected format
    return response as { user: User; tokens: AuthToken; expiresIn: number } | { message: string; requiresAdditionalVerification: boolean; user: User };
  }

  async login(mobileNumber: string, otp: string): Promise<{ user: User; tokens: AuthToken }> {
    const payload = mobileLoginSchema.parse({ mobileNumber, otpCode: otp });

    const response = await this.makeRequest('login/mobile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Use type adapter to convert API response to shared types
    const adaptedResponse = adaptApiAuthResponse(response);
    return adaptedResponse;
  }

  async sendLoginOTP(mobileNumber: string): Promise<{ message: string; expiresIn: number }> {
    const payload = {
      mobileNumber,
      type: 'SMS' as const,
    };

    return this.makeRequest('request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async oauthSignup(
    provider: 'GOOGLE', 
    code: string, 
    redirectUri: string
  ): Promise<{ user: User; tokens: AuthToken }> {
    // For OAuth signup, we send the authorization code to the backend
    // The backend will exchange it for access tokens and user info
    const payload = {
      provider,
      code,
      redirectUri,
      mobileNumber: null, // Will be set by backend based on OAuth user info
    };

    const response = await this.makeRequest('oauth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Use type adapter to convert API response to shared types
    const adaptedResponse = adaptApiAuthResponse(response);
    return adaptedResponse;
  }

  async refreshToken(refreshToken: string): Promise<{ user: User; tokens: AuthToken }> {
    const response = await this.makeRequest('refresh-token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    // Use type adapter to convert API response to shared types
    const adaptedResponse = adaptApiAuthResponse(response);
    return adaptedResponse;
  }

  async logout(): Promise<void> {
    // This might be a client-side only operation, but keeping for consistency
    await this.makeRequest('logout', {
      method: 'POST',
    });
  }

  // New method for profile updates
  async updateProfile(profileData: any): Promise<{ profile: any }> {
    const response = await this.makeUsersRequest('profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    return { profile: response };
  }

  // New method for payment details updates
  async updatePaymentDetails(paymentData: any): Promise<{ paymentDetails: any }> {
    const response = await this.makeUsersRequest('payment-details', {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });

    return { paymentDetails: response };
  }

  // Method to check API health and compatibility
  async checkApiHealth(): Promise<{ status: string; version: string; platform: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'X-Platform': 'mobile',
          'X-Client-Type': 'mobile',
        },
      });

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`API health check failed: ${errorMessage}`);
    }
  }

  // NEW METHODS FOR PHASE 2B.1 IMPLEMENTATION

  /**
   * Setup password for user account
   * @param userId - User ID from authenticated context
   * @param passwordData - Password and confirmation
   * @returns Success response
   */
  async setupPassword(mobileNumber: string, passwordData: any): Promise<{ success: boolean; message: string }> {
    const payload = passwordSetupSchema.parse(passwordData);
    
    const response = await this.makeRequest<{ success: boolean; message: string }>('setup-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  /**
   * Verify email with verification token
   * @param token - Email verification token
   * @returns User data and verification status
   */
  async verifyEmail(token: string): Promise<{ user: User; message: string; requiresPasswordSetup: boolean }> {
    const payload = emailVerificationSchema.parse({ token });

    const response = await this.makeRequest<{ user: User; message: string; requiresPasswordSetup: boolean }>('verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  /**
   * Request email verification for a specific email
   * @param email - Email address to verify
   * @returns Success response
   */
  async requestEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await this.makeRequest<{ success: boolean; message: string }>('request-email-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
  }

  /**
   * Request password reset for an email
   * @param email - Email address for password reset
   * @returns Success response
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const payload = passwordResetRequestSchema.parse({ email });

    const response = await this.makeRequest<{ success: boolean; message: string }>('request-password-reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  /**
   * Reset password with reset token
   * @param token - Password reset token
   * @param passwordData - New password and confirmation
   * @returns Success response
   */
  async resetPassword(token: string, passwordData: any): Promise<{ success: boolean; message: string }> {
    const payload = passwordResetSchema.parse({
      token,
      ...passwordData,
    });

    const response = await this.makeRequest<{ success: boolean; message: string }>('reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response;
  }

  /**
   * Login with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns User data and authentication tokens
   */
  async loginWithEmail(email: string, password: string): Promise<{ user: User; tokens: AuthToken }> {
    const payload = {
      email,
      password,
    };

    const response = await this.makeRequest('login/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Use type adapter to convert API response to shared types
    const adaptedResponse = adaptApiAuthResponse(response);
    return adaptedResponse;
  }

  /**
   * Login with OAuth provider
   * @param provider - OAuth provider (GOOGLE, FACEBOOK)
   * @param accessToken - OAuth access token
   * @returns User data and authentication tokens
   */
  async loginWithOAuth(provider: 'GOOGLE' | 'FACEBOOK', code: string): Promise<{ user: User; tokens: AuthToken }> {
    // For OAuth login, we send the authorization code to the backend
    // The backend will exchange it for access tokens and authenticate the user
    const payload = {
      provider,
      code,
    };

    const response = await this.makeRequest('login/oauth', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Use type adapter to convert API response to shared types
    const adaptedResponse = adaptApiAuthResponse(response);
    return adaptedResponse;
  }

  /**
   * Check if user has password set
   * @param userId - User ID to check
   * @returns Boolean indicating if password is set
   */
  async hasPassword(userId: string): Promise<boolean> {
    try {
      // This would typically be a separate endpoint, but for now we'll use the profile endpoint
      // In a real implementation, you might want to add a specific endpoint for this
      const response = await this.makeUsersRequest<{ hasPassword: boolean }>(`${userId}/has-password`, {
        method: 'GET',
      });
      
      return response.hasPassword || false;
    } catch (error) {
      // If the endpoint doesn't exist, assume no password (for backward compatibility)
      return false;
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Boolean indicating if password meets strength requirements
   */
  validatePasswordStrength(password: string): boolean {
    // Minimum 8 characters, at least one lowercase, one uppercase, one number
    const minLength = 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return password.length >= minLength && hasLowercase && hasUppercase && hasNumber;
  }

  /**
   * Get user profile information
   * @param userId - User ID to get profile for
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<any> {
    const response = await this.makeUsersRequest(`${userId}/profile`, {
      method: 'GET',
    });

    return response;
  }

  /**
   * Update user profile information
   * @param userId - User ID to update profile for
   * @returns Updated profile data
   */
  async updateUserProfile(userId: string, profileData: any): Promise<any> {
    const response = await this.makeUsersRequest(`${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    return response;
  }

  // TOKEN MANAGEMENT METHODS

  /**
   * Store authentication tokens securely
   * @param tokens - Authentication tokens to store
   */
  async storeTokens(tokens: AuthToken): Promise<void> {
    try {
      console.log('Auth service: storeTokens called with:', tokens);
      console.log('Auth service: Token type:', typeof tokens);
      console.log('Auth service: Token keys:', Object.keys(tokens || {}));
      
      // Validate tokens before storing
      if (!tokens || typeof tokens !== 'object') {
        throw new Error('Invalid tokens object provided');
      }
      
      if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresIn) {
        throw new Error(`Missing required token fields: accessToken=${!!tokens.accessToken}, refreshToken=${!!tokens.refreshToken}, expiresIn=${!!tokens.expiresIn}`);
      }
      
      // In a real implementation, you would use secure storage like Expo SecureStore
      // For now, we'll use AsyncStorage as a placeholder
      const tokenData = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
        storedAt: Date.now(),
      };
      
      console.log('Auth service: Prepared token data:', tokenData);
      
      // Test AsyncStorage availability
      try {
        await AsyncStorage.setItem('test_key', 'test_value');
        await AsyncStorage.removeItem('test_key');
        console.log('Auth service: AsyncStorage is working');
      } catch (storageError) {
        console.error('Auth service: AsyncStorage test failed:', storageError);
        throw new Error('AsyncStorage is not available or working properly');
      }
      
      // Store in AsyncStorage (replace with SecureStore in production)
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokenData));
      
      console.log('Auth service: Tokens stored successfully');
    } catch (error) {
      console.error('Auth service: Failed to store tokens:', error);
      throw new Error(`Failed to store authentication tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve stored authentication tokens
   * @returns Stored authentication tokens or null if not found
   */
  async getStoredTokens(): Promise<AuthToken | null> {
    try {
      const tokenData = await AsyncStorage.getItem('auth_tokens');
      
      if (!tokenData) {
        return null;
      }
      
      const parsed = JSON.parse(tokenData);
      
      // Check if tokens are expired
      const now = Date.now();
      const storedAt = parsed.storedAt || 0;
      const expiresIn = parsed.expiresIn || 0;
      
      if (now - storedAt > expiresIn * 1000) {
        // Tokens are expired, remove them
        await this.clearStoredTokens();
        return null;
      }
      
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresIn: parsed.expiresIn,
        tokenType: parsed.tokenType,
      };
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  /**
   * Clear stored authentication tokens
   */
  async clearStoredTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_tokens');
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if current access token is expired or about to expire
   * @param bufferMinutes - Buffer time in minutes before considering token expired
   * @returns Boolean indicating if token needs refresh
   */
  async isTokenExpired(bufferMinutes: number = 5): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) {
        return true;
      }
      
      const now = Date.now();
      const storedAt = Date.now() - (tokens.expiresIn * 1000);
      const bufferMs = bufferMinutes * 60 * 1000;
      
      return (now - storedAt + bufferMs) >= tokens.expiresIn * 1000;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true; // Assume expired if we can't check
    }
  }

  /**
   * Automatically refresh tokens if they're expired or about to expire
   * @returns New tokens or null if refresh failed
   */
  async autoRefreshTokens(): Promise<AuthToken | null> {
    try {
      if (!(await this.isTokenExpired())) {
        // Tokens are still valid
        return await this.getStoredTokens();
      }
      
      const tokens = await this.getStoredTokens();
      if (!tokens?.refreshToken) {
        return null;
      }
      
      // Attempt to refresh tokens
      const newTokens = await this.refreshToken(tokens.refreshToken);
      
      // Store new tokens
      await this.storeTokens(newTokens.tokens);
      
      return newTokens.tokens;
    } catch (error) {
      console.error('Failed to auto-refresh tokens:', error);
      // Clear invalid tokens
      await this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns Valid access token or null if not available
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.autoRefreshTokens();
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Add authentication headers to a request
   * @param headers - Existing headers to extend
   * @returns Headers with authentication
   */
  async addAuthHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const accessToken = await this.getValidAccessToken();
    
    if (accessToken) {
      return {
        ...headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }
    
    return headers;
  }

  /**
   * Signup with the new progressive flow
   * @param signupData - Initial signup data (name + mobile)
   * @returns Promise with signup result
   */
  async newInitialSignup(signupData: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
  }): Promise<any> {
    return this.makeRequest('signup/initial', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  /**
   * Verify OTP for the new signup flow
   * @param verificationData - OTP verification data
   * @returns Promise with verification result
   */
  async newVerifySignupOtp(verificationData: {
    mobileNumber: string;
    otpCode: string;
  }): Promise<any> {
    return this.makeRequest('signup/verify-otp', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  /**
   * Setup password for the new signup flow
   * @param passwordData - Password setup data
   * @returns Promise with password setup result
   */
  async newSetupPassword(passwordData: {
    mobileNumber: string;
    password: string;
    confirmPassword: string;
  }): Promise<any> {
    return this.makeRequest('signup/setup-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  /**
   * Add email to account (optional step)
   * @param emailData - Email data
   * @returns Promise with email addition result
   */
  async newAddEmail(emailData: {
    mobileNumber: string;
    email: string;
  }): Promise<any> {
    return this.makeRequest('signup/add-email', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

}

export const authService = new AuthService();
