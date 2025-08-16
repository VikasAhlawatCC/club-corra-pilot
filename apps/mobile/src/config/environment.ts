import Constants from 'expo-constants';
import { getCurrentConfig } from './server-config';

// Environment configuration for the mobile app

// Debug: Log all environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('Constants:', Constants);
console.log('Constants.expoConfig:', Constants.expoConfig);
console.log('Constants.extra:', Constants.expoConfig?.extra);
console.log('API Base URL from Constants:', Constants.expoConfig?.extra?.apiBaseUrl);
console.log('WS URL from Constants:', Constants.expoConfig?.extra?.wsUrl);
console.log('========================');

// Get current server configuration
const currentServerConfig = getCurrentConfig();
console.log('Current server config:', currentServerConfig);

// Ensure base URLs include Nest global prefix `/api/v1`
// Use the configuration from server-config.ts for development
const normalizeApiBase = (base?: string) => {
  const raw = base || currentServerConfig.apiBaseUrl;
  return raw.endsWith('/api/v1') ? raw : `${raw.replace(/\/$/, '')}/api/v1`;
};

// For WebSocket connections, use the base server URL (not the API endpoint)
const normalizeWsUrl = (base?: string) => {
  const raw = base || currentServerConfig.wsUrl;
  // Remove /api/v1 if present, as WebSocket connects to base server
  return raw.replace('/api/v1', '').replace(/\/$/, '');
};

// Safe access to Constants.expoConfig.extra
const getExtraConfig = () => {
  try {
    return Constants.expoConfig?.extra || {};
  } catch (error) {
    console.log('Error accessing Constants.expoConfig.extra:', error);
    return {};
  }
};

export const environment = {
  // API Configuration
  apiBaseUrl: normalizeApiBase(getExtraConfig().apiBaseUrl),
  
  // WebSocket Configuration
  wsUrl: normalizeWsUrl(getExtraConfig().wsUrl),
  
  // CDN Configuration
  cdnUrl: getExtraConfig().cdnUrl || 'https://cdn.clubcorra.com',
  
  // Sentry Configuration (for error monitoring)
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  
  // Feature Flags
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  
  // Development Configuration
  environment: getExtraConfig().environment || 'development',
  debugMode: getExtraConfig().debugMode || false,
  
  // App Configuration
  appName: 'Club Corra',
  appVersion: '1.0.0',
  
  // API Endpoints
  endpoints: {
    auth: {
      signup: '/auth/signup',
      login: '/auth/login',
      otp: {
        send: '/auth/otp/send',
        verify: '/auth/otp/verify',
      },
      refresh: '/auth/refresh',
    },
    users: {
      profile: '/users/profile',
      paymentDetails: '/users/payment-details',
    },
    brands: {
      list: '/brands',
      detail: '/brands/:id',
    },
    coins: {
      balance: '/coins/balance',
      transactions: '/coins/transactions',
      welcomeBonus: '/welcome-bonus',
    },
  },
  
  // Default values
  defaults: {
    welcomeBonusAmount: 100,
    otpExpirySeconds: 300, // 5 minutes
    maxOtpAttempts: 3,
  },
};

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  return `${environment.apiBaseUrl}${endpoint}`;
};

// Helper function to get CDN URL
export const getCdnUrl = (path: string): string => {
  return `${environment.cdnUrl}${path}`;
};

// Helper function to check if in development mode
export const isDevelopment = (): boolean => {
  return environment.environment === 'development';
};

// Helper function to check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return environment.debugMode;
};
