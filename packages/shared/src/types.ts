// Common types used across the monorepo
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Password and email verification types
export interface PasswordSetupRequest {
  mobileNumber: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Authentication Types
export enum AuthProvider {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

export interface User extends BaseEntity {
  mobileNumber: string;
  email?: string;
  status: UserStatus;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  hasWelcomeBonusProcessed?: boolean;
  profile?: UserProfile;
  paymentDetails?: PaymentDetails;
  authProviders: AuthProviderLink[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profilePicture?: string;
  address?: Address;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface PaymentDetails {
  upiId?: string;
  mobileNumber?: string;
}

export interface AuthProviderLink {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  linkedAt: Date;
}

export interface OTPVerification {
  id: string;
  userId?: string;
  mobileNumber?: string;
  email?: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  createdAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface JwtPayload {
  sub: string; // user ID
  mobileNumber: string;
  email?: string;
  roles?: string[]; // For regular users
  role?: 'ADMIN' | 'SUPER_ADMIN'; // For admin users
  iat: number;
  exp: number;
}

// Note: Brand, Coin, and Transaction types are now defined in their respective schema files
// to avoid conflicts and provide better validation
