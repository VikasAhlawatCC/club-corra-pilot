/**
 * Standardized response interfaces for authentication operations
 */
export interface BaseAuthResponse {
  success: boolean;
  message: string;
}

export interface EmailVerificationResponse extends BaseAuthResponse {
  user?: any;
  requiresPasswordSetup?: boolean;
  expiresIn?: number;
}

export interface PasswordResetResponse extends BaseAuthResponse {
  // Generic response for security (doesn't reveal if email exists)
}

export interface PasswordSetupResponse extends BaseAuthResponse {
  // Success confirmation
}

export interface TokenResponse extends BaseAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserResponse extends BaseAuthResponse {
  user: any;
  tokens?: TokenResponse;
}

/**
 * Error response interface for consistent error handling
 */
export interface AuthErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  details?: any;
}

/**
 * Success response interface for consistent success handling
 */
export interface AuthSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}
