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
  console.log('Type adapter: adaptApiAuthTokenToAuthToken called with:', apiToken);
  console.log('Type adapter: Token type:', typeof apiToken);
  console.log('Type adapter: Token keys:', Object.keys(apiToken || {}));
  
  // Validate required fields
  if (!apiToken.accessToken || !apiToken.refreshToken || !apiToken.expiresIn) {
    console.error('Type adapter: Missing required token fields:', {
      hasAccessToken: !!apiToken.accessToken,
      hasRefreshToken: !!apiToken.refreshToken,
      hasExpiresIn: !!apiToken.expiresIn,
    });
    throw new Error('Invalid token structure: missing required fields');
  }
  
  const adaptedToken = {
    accessToken: apiToken.accessToken,
    refreshToken: apiToken.refreshToken,
    expiresIn: apiToken.expiresIn,
    tokenType: 'Bearer' as const,
  };
  
  console.log('Type adapter: Successfully adapted token:', adaptedToken);
  return adaptedToken;
}

// Convert API response to shared auth response type
export function adaptApiAuthResponse(apiResponse: any) {
  console.log('Type adapter: adaptApiAuthResponse called with:', apiResponse);
  console.log('Type adapter: Response type:', typeof apiResponse);
  console.log('Type adapter: Response keys:', Object.keys(apiResponse || {}));
  
  // Handle case where backend returns tokens as separate fields (not nested in tokens object)
  if (apiResponse.user && (apiResponse.accessToken || apiResponse.refreshToken)) {
    console.log('Type adapter: Processing user with separate token fields...');
    
    try {
      // Validate required token fields
      if (!apiResponse.accessToken || !apiResponse.refreshToken || !apiResponse.expiresIn) {
        console.error('Type adapter: Missing required token fields:', {
          hasAccessToken: !!apiResponse.accessToken,
          hasRefreshToken: !!apiResponse.refreshToken,
          hasExpiresIn: !!apiResponse.expiresIn,
        });
        throw new Error('Invalid response: missing required token fields');
      }
      
      // Create tokens object from separate fields
      const tokens = {
        accessToken: apiResponse.accessToken,
        refreshToken: apiResponse.refreshToken,
        expiresIn: apiResponse.expiresIn,
        tokenType: 'Bearer' as const,
      };
      
      console.log('Type adapter: Created tokens object:', tokens);
      
      return {
        user: adaptApiUserToUser(apiResponse.user),
        tokens: tokens,
      };
    } catch (error) {
      console.error('Type adapter: Error creating tokens object:', error);
      throw error;
    }
  }
  
  // Handle case where tokens are nested in a tokens object
  if (apiResponse.user && apiResponse.tokens) {
    console.log('Type adapter: Processing user and nested tokens...');
    console.log('Type adapter: Tokens object:', apiResponse.tokens);
    console.log('Type adapter: Tokens keys:', Object.keys(apiResponse.tokens || {}));
    
    try {
      const adaptedTokens = adaptApiAuthTokenToAuthToken(apiResponse.tokens);
      console.log('Type adapter: Adapted tokens:', adaptedTokens);
      
      return {
        user: adaptApiUserToUser(apiResponse.user),
        tokens: adaptedTokens,
      };
    } catch (error) {
      console.error('Type adapter: Error adapting tokens:', error);
      throw error;
    }
  }
  
  // If it's just a user object
  if (apiResponse.user) {
    console.log('Type adapter: Processing user only...');
    return {
      user: adaptApiUserToUser(apiResponse.user),
      tokens: apiResponse.tokens,
    };
  }
  
  console.log('Type adapter: No conversion needed, returning as-is');
  // Return as-is if no conversion needed
  return apiResponse;
}
