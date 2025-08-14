import { AuthProvider } from '@shared/types';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

export interface OAuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
  };
}

export interface OAuthResult {
  code: string;
  redirectUri: string;
  accessToken?: string;
  userInfo?: OAuthUser;
}

class OAuthService {
  private config: OAuthConfig = {
    google: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirectUri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || '',
    },
  };

  // Real OAuth implementation using expo-auth-session
  async authenticateWithGoogle(): Promise<OAuthResult> {
    try {
      // Validate configuration
      if (!this.config.google.clientId) {
        throw new Error('Google OAuth client ID is not configured');
      }

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'clubcorra',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: this.config.google.clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params.code) {
        return {
          code: result.params.code,
          redirectUri,
        };
      } else if (result.type === 'cancel') {
        throw new Error('Google OAuth was cancelled by the user');
      } else {
        throw new Error('Google OAuth authentication failed');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      if (error instanceof Error) {
        // Re-throw with more descriptive messages
        if (error.message.includes('Network') || error.message.includes('network')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('cancelled') || error.message.includes('cancel')) {
          throw new Error('Authentication was cancelled. Please try again.');
        } else if (error.message.includes('not configured') || error.message.includes('client ID is not configured')) {
          throw new Error('OAuth is not properly configured. Please contact support.');
        } else if (error.message.includes('authentication failed')) {
          throw new Error('Google OAuth authentication failed. Please try again.');
        } else {
          // For any other specific error, provide a generic but helpful message
          throw new Error(`Authentication failed: ${error.message}`);
        }
      }
      throw new Error('Google OAuth failed: Unknown error occurred');
    }
  }

  // Generic OAuth authentication method
  async authenticate(provider: 'GOOGLE'): Promise<OAuthResult> {
    switch (provider) {
      case 'GOOGLE':
        return this.authenticateWithGoogle();
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  // Get OAuth configuration
  getConfig(): OAuthConfig {
    return this.config;
  }

  // Check if OAuth is properly configured
  isConfigured(): boolean {
    return !!this.config.google.clientId && !!this.config.google.redirectUri;
  }

  // Get redirect URI for a provider
  getRedirectUri(provider: 'GOOGLE'): string {
    return this.config.google.redirectUri;
  }

  // Validate OAuth configuration
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.google.clientId) {
      errors.push('Google OAuth client ID is missing');
    }
    
    if (!this.config.google.redirectUri) {
      errors.push('Google OAuth redirect URI is missing');
    }
    
    if (this.config.google.clientId && this.config.google.clientId === 'your_google_client_id_here') {
      errors.push('Google OAuth client ID is not configured (using placeholder value)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get OAuth provider status
  getProviderStatus(provider: 'GOOGLE'): { configured: boolean; clientId: string; redirectUri: string } {
    switch (provider) {
      case 'GOOGLE':
        return {
          configured: !!this.config.google.clientId && this.config.google.clientId !== 'your_google_client_id_here',
          clientId: this.config.google.clientId,
          redirectUri: this.config.google.redirectUri,
        };
      default:
        return {
          configured: false,
          clientId: '',
          redirectUri: '',
        };
    }
  }
}

export const oauthService = new OAuthService();
