/**
 * Authentication-related constants and configuration values
 */
export const AUTH_CONSTANTS = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    SALT_ROUNDS: 10,
    REQUIREMENTS: {
      LOWERCASE: true,
      UPPERCASE: true,
      NUMBERS: true,
      SPECIAL_CHARS: false,
    },
  },

  // Token expiry times (in hours)
  TOKEN_EXPIRY: {
    EMAIL_VERIFICATION: 24,
    PASSWORD_RESET: 1,
    ACCESS_TOKEN: 7 * 24, // 7 days
    REFRESH_TOKEN: 30 * 24, // 30 days
    WEB_ACCESS_TOKEN: 24, // 24 hours
  },

  // OTP configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 5,
    MAX_ATTEMPTS: 3,
  },

  // Security settings
  SECURITY: {
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS_PER_WINDOW: 5,
  },
} as const;

/**
 * Error messages for authentication operations
 */
export const AUTH_ERROR_MESSAGES = {
  PASSWORD: {
    TOO_SHORT: 'Password must be at least 8 characters',
    WEAK: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    MISMATCH: 'Passwords do not match',
    REQUIRED: 'Password is required',
    CONFIRMATION_REQUIRED: 'Password confirmation is required',
  },
  TOKEN: {
    INVALID: 'Invalid token',
    EXPIRED: 'Token has expired',
    REQUIRED: 'Token is required',
  },
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    NOT_VERIFIED: 'User not verified',
  },
  EMAIL: {
    INVALID: 'Please provide a valid email address',
    REQUIRED: 'Email is required',
    ALREADY_VERIFIED: 'Email is already verified',
    VERIFICATION_FAILED: 'Failed to verify email',
  },
} as const;
