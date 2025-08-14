// Centralized error messages for Club Corra Mobile App
// This file provides consistent error messaging across the application

export const AUTH_ERROR_MESSAGES = {
  // Mobile number related errors
  MOBILE_ALREADY_REGISTERED: 'This mobile number is already registered. Please try logging in instead.',
  INVALID_MOBILE: 'Please enter a valid mobile number.',
  MOBILE_REQUIRED: 'Mobile number is required.',
  MOBILE_TOO_SHORT: 'Mobile number must be at least 10 digits.',
  MOBILE_TOO_LONG: 'Mobile number must not exceed 15 digits.',
  MOBILE_INVALID_FORMAT: 'Mobile number must contain only digits and optional + prefix.',

  // Email related errors
  EMAIL_ALREADY_REGISTERED: 'This email is already registered. Please try logging in instead.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  EMAIL_REQUIRED: 'Email address is required.',
  EMAIL_INVALID_FORMAT: 'Please enter a valid email format.',

  // OTP related errors
  INVALID_OTP: 'The verification code you entered is incorrect. Please try again.',
  OTP_EXPIRED: 'The verification code has expired. Please request a new one.',
  OTP_TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please wait before trying again.',
  OTP_REQUIRED: 'Please enter the verification code.',
  OTP_TOO_SHORT: 'Verification code must be at least 6 digits.',
  OTP_TOO_LONG: 'Verification code must not exceed 6 digits.',
  OTP_INVALID_FORMAT: 'Verification code must contain only digits.',

  // Password related errors
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_MISSING_LOWERCASE: 'Password must contain at least one lowercase letter.',
  PASSWORD_MISSING_UPPERCASE: 'Password must contain at least one uppercase letter.',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please try again.',
  PASSWORD_REQUIRED: 'Password is required.',

  // Profile related errors
  FIRST_NAME_REQUIRED: 'First name is required.',
  LAST_NAME_REQUIRED: 'Last name is required.',
  FIRST_NAME_TOO_LONG: 'First name is too long.',
  LAST_NAME_TOO_LONG: 'Last name is too long.',

  // Authentication flow errors
  SIGNUP_INITIATION_FAILED: 'Failed to initiate signup. Please try again.',
  OTP_VERIFICATION_FAILED: 'OTP verification failed. Please try again.',
  PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',

  // Network and general errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
} as const;

export const VALIDATION_ERROR_MESSAGES = {
  // Form validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_FORMAT: 'Please enter a valid format.',
  TOO_SHORT: 'This field is too short.',
  TOO_LONG: 'This field is too long.',
  INVALID_CHARACTERS: 'This field contains invalid characters.',
  
  // Input specific errors
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  INVALID_PERCENTAGE: 'Please enter a valid percentage.',
} as const;

export const BUSINESS_ERROR_MESSAGES = {
  // Transaction related errors
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction.',
  TRANSACTION_LIMIT_EXCEEDED: 'Transaction amount exceeds the allowed limit.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  
  // Account related errors
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  ACCOUNT_NOT_VERIFIED: 'Please verify your account to continue.',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',
  OTP_RATE_LIMIT: 'Too many OTP requests. Please wait before requesting another.',
} as const;

// Helper function to get error message by key
export const getErrorMessage = (
  key: keyof typeof AUTH_ERROR_MESSAGES | keyof typeof VALIDATION_ERROR_MESSAGES | keyof typeof BUSINESS_ERROR_MESSAGES,
  fallback: string = 'An error occurred. Please try again.'
): string => {
  return (
    AUTH_ERROR_MESSAGES[key as keyof typeof AUTH_ERROR_MESSAGES] ||
    VALIDATION_ERROR_MESSAGES[key as keyof typeof VALIDATION_ERROR_MESSAGES] ||
    BUSINESS_ERROR_MESSAGES[key as keyof typeof BUSINESS_ERROR_MESSAGES] ||
    fallback
  );
};

// Export all error message types
export type AuthErrorKey = keyof typeof AUTH_ERROR_MESSAGES;
export type ValidationErrorKey = keyof typeof VALIDATION_ERROR_MESSAGES;
export type BusinessErrorKey = keyof typeof BUSINESS_ERROR_MESSAGES;
export type ErrorMessageKey = AuthErrorKey | ValidationErrorKey | BusinessErrorKey;
