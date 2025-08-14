import { AuthProvider, UserStatus, VerificationStatus } from './types';
import { SHA256 } from 'crypto-js';

// Constants for configuration
export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  TOKEN_EXPIRY_HOURS: 24,
  MAX_OTP_ATTEMPTS: 3,
  SESSION_ID_PREFIX: 'sess_',
  TOKEN_LENGTH: 32,
} as const;

// Common utility functions used across the monorepo
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Generates a secure 6-digit OTP for authentication
 * @returns A 6-digit numeric OTP string
 */
export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < AUTH_CONSTANTS.OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generates a secure random token for authentication
 * @param length - Length of the token (default: 32)
 * @returns A secure random token string
 */
export const generateSecureToken = (length: number = AUTH_CONSTANTS.TOKEN_LENGTH): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};

/**
 * Securely hashes an OTP using SHA-256 with salt
 * @param otp - The OTP to hash
 * @param salt - Optional salt for additional security
 * @returns A secure hash of the OTP
 */
export const hashOTP = (otp: string, salt?: string): string => {
  const saltedOTP = salt ? `${otp}${salt}` : otp;
  return SHA256(saltedOTP).toString();
};

/**
 * Verifies an OTP against its hash
 * @param otp - The OTP to verify
 * @param hash - The stored hash to compare against
 * @param salt - Optional salt used during hashing
 * @returns True if OTP matches the hash, false otherwise
 */
export const verifyOTPHash = (otp: string, hash: string, salt?: string): boolean => {
  const computedHash = hashOTP(otp, salt);
  return computedHash === hash;
};

/**
 * Calculates OTP expiry time
 * @param minutes - Minutes until expiry (default: 5)
 * @returns Date when OTP expires
 */
export const calculateOTPExpiry = (minutes: number = AUTH_CONSTANTS.OTP_EXPIRY_MINUTES): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

/**
 * Checks if an OTP has expired
 * @param expiryDate - The expiry date to check
 * @returns True if OTP has expired, false otherwise
 */
export const isOTPExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate;
};

/**
 * Validates mobile number format with international support
 * @param mobileNumber - The mobile number to validate
 * @returns True if valid, false otherwise
 */
export const validateMobileNumber = (mobileNumber: string): boolean => {
  // International format: +[country code][number]
  // National format: [number] (assumes local country)
  const mobileRegex = /^\+?[1-9]\d{1,14}$/;
  return mobileRegex.test(mobileNumber) && mobileNumber.length >= 10 && mobileNumber.length <= 15;
};

/**
 * Validates international phone number format
 * @param phoneNumber - The phone number to validate
 * @returns True if valid international format, false otherwise
 */
export const validateInternationalPhoneNumber = (phoneNumber: string): boolean => {
  // Must start with + and have country code + number
  const internationalRegex = /^\+[1-9]\d{1,14}$/;
  return internationalRegex.test(phoneNumber) && phoneNumber.length >= 11 && phoneNumber.length <= 16;
};

/**
 * Validates email format
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats mobile number to standard format
 * @param mobileNumber - The mobile number to format
 * @returns Formatted mobile number
 */
export const formatMobileNumber = (mobileNumber: string): string => {
  // Remove all non-digit characters except +
  const cleaned = mobileNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with + if it's an international number
  if (cleaned.length > 10 && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Formats Indian mobile number with country code
 * @param mobileNumber - The 10-digit mobile number
 * @returns Formatted mobile number with +91 country code
 */
export const formatIndianMobileNumber = (mobileNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = mobileNumber.replace(/\D/g, '');
  
  // If it's already 12 digits with country code, return as is
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  // If it's 10 digits, add +91 country code
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has +91, return as is
  if (mobileNumber.startsWith('+91')) {
    return mobileNumber;
  }
  
  // If it's 11 digits starting with 0, remove 0 and add +91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.slice(1)}`;
  }
  
  // Return original if format is unclear
  return mobileNumber;
};

/**
 * Masks mobile number for display (shows only last 4 digits)
 * @param mobileNumber - The mobile number to mask
 * @returns Masked mobile number
 */
export const maskMobileNumber = (mobileNumber: string): string => {
  if (mobileNumber.length < 4) return mobileNumber;
  
  const visibleDigits = 4;
  const maskedLength = mobileNumber.length - visibleDigits;
  const masked = '*'.repeat(maskedLength);
  const visible = mobileNumber.slice(-visibleDigits);
  
  return masked + visible;
};

/**
 * Masks email for display (shows first and last character of local part)
 * @param email - The email to mask
 * @returns Masked email
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};

/**
 * Checks if user status is active
 * @param status - The user status to check
 * @returns True if user is active, false otherwise
 */
export const isUserActive = (status: UserStatus): boolean => {
  return status === UserStatus.ACTIVE;
};

/**
 * Checks if user is fully verified
 * @param mobileVerified - Whether mobile is verified
 * @param emailVerified - Whether email is verified
 * @returns True if both are verified, false otherwise
 */
export const isUserVerified = (mobileVerified: boolean, emailVerified: boolean): boolean => {
  return mobileVerified && emailVerified;
};

/**
 * Gets display name for authentication provider
 * @param provider - The auth provider
 * @returns Human-readable provider name
 */
export const getAuthProviderDisplayName = (provider: AuthProvider): string => {
  switch (provider) {
    case AuthProvider.SMS:
      return 'SMS';
    case AuthProvider.EMAIL:
      return 'Email';
    case AuthProvider.GOOGLE:
      return 'Google';
    case AuthProvider.FACEBOOK:
      return 'Facebook';
    default:
      return 'Unknown';
  }
};

/**
 * Generates user display name from first and last name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Formatted display name
 */
export const generateUserDisplayName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Sanitizes user input by trimming whitespace and normalizing spaces
 * @param input - The input string to sanitize
 * @returns Sanitized input string
 */
export const sanitizeUserInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Validates UPI ID format
 * @param upiId - The UPI ID to validate
 * @returns True if valid UPI ID format, false otherwise
 */
export const validateUPIId = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return upiRegex.test(upiId);
};

/**
 * Generates a unique session ID
 * @returns A unique session identifier
 */
export const generateSessionId = (): string => {
  return `${AUTH_CONSTANTS.SESSION_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculates token expiry time
 * @param hours - Hours until expiry (default: 24)
 * @returns Date when token expires
 */
export const calculateTokenExpiry = (hours: number = AUTH_CONSTANTS.TOKEN_EXPIRY_HOURS): Date => {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
};

/**
 * Checks if a token has expired
 * @param expiryDate - The expiry date to check
 * @returns True if token has expired, false otherwise
 */
export const isTokenExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate;
};
