import { User, UserStatus, AuthProvider, VerificationStatus } from '../types';

/**
 * Type adapter utilities for converting between API entities and shared types
 * This ensures cross-platform compatibility when the API and shared types differ
 */

// API entity types (what the API actually returns)
export interface ApiUser {
  id: string;
  mobileNumber: string;
  email?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  profile?: any;
  paymentDetails?: any;
  authProviders: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Convert API user status to shared user status
export function adaptUserStatus(apiStatus: string): UserStatus {
  switch (apiStatus) {
    case 'PENDING':
      return UserStatus.PENDING;
    case 'ACTIVE':
      return UserStatus.ACTIVE;
    case 'SUSPENDED':
      return UserStatus.SUSPENDED;
    case 'DELETED':
      return UserStatus.DELETED;
    default:
      return UserStatus.PENDING;
  }
}

// Convert API auth provider to shared auth provider
export function adaptAuthProvider(apiProvider: string): AuthProvider {
  switch (apiProvider) {
    case 'SMS':
      return AuthProvider.SMS;
    case 'EMAIL':
      return AuthProvider.EMAIL;
    case 'GOOGLE':
      return AuthProvider.GOOGLE;
    case 'FACEBOOK':
      return AuthProvider.FACEBOOK;
    default:
      return AuthProvider.SMS;
  }
}

// Convert API user to shared user type
export function adaptApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    mobileNumber: apiUser.mobileNumber,
    email: apiUser.email,
    status: adaptUserStatus(apiUser.status),
    isMobileVerified: apiUser.isMobileVerified,
    isEmailVerified: apiUser.isEmailVerified,
    profile: apiUser.profile,
    paymentDetails: apiUser.paymentDetails,
    authProviders: apiUser.authProviders?.map(provider => ({
      provider: adaptAuthProvider(provider.provider),
      providerId: provider.providerUserId,
      email: provider.email,
      linkedAt: provider.createdAt,
    })) || [],
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
}

// Convert API auth token to shared auth token type
export function adaptApiAuthTokenToAuthToken(apiToken: ApiAuthToken) {
  return {
    accessToken: apiToken.accessToken,
    refreshToken: apiToken.refreshToken,
    expiresIn: apiToken.expiresIn,
    tokenType: 'Bearer' as const,
  };
}

// Convert API response to shared auth response type
export function adaptApiAuthResponse(apiResponse: any) {
  if (apiResponse.user && apiResponse.tokens) {
    return {
      user: adaptApiUserToUser(apiResponse.user),
      tokens: adaptApiAuthTokenToAuthToken(apiResponse.tokens),
    };
  }
  
  // If it's just a user object
  if (apiResponse.user) {
    return {
      user: adaptApiUserToUser(apiResponse.user),
      tokens: apiResponse.tokens,
    };
  }
  
  // Return as-is if no conversion needed
  return apiResponse;
}
