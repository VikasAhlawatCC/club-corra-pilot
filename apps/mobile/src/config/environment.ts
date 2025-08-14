import Constants from 'expo-constants';

// Environment configuration for the mobile app

// Debug: Log all environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('Constants.extra:', Constants.expoConfig?.extra);
console.log('API Base URL from Constants:', Constants.expoConfig?.extra?.apiBaseUrl);
console.log('WS URL from Constants:', Constants.expoConfig?.extra?.wsUrl);
console.log('========================');

// Ensure base URLs include Nest global prefix `/api/v1`
// For mobile devices, we need to use network IP, not localhost
const normalizeApiBase = (base?: string) => {
  const raw = base || 'http://192.168.1.5:3001';
  return raw.endsWith('/api/v1') ? raw : `${raw.replace(/\/$/, '')}/api/v1`;
};

// For WebSocket connections, we need to use network IP when running on mobile devices
// localhost only works when testing from the same machine
const normalizeWsUrl = (base?: string) => {
  const raw = base || 'http://192.168.1.5:3001';
  return raw.endsWith('/api/v1') ? raw : `${raw.replace(/\/$/, '')}/api/v1`;
};

export const environment = {
  // API Configuration
  apiBaseUrl: normalizeApiBase(Constants.expoConfig?.extra?.apiBaseUrl),
  
  // WebSocket Configuration
  wsUrl: normalizeWsUrl(Constants.expoConfig?.extra?.wsUrl),
  
  // CDN Configuration
  cdnUrl: process.env.EXPO_PUBLIC_CDN_URL || 'https://cdn.clubcorra.com',
  
  // Sentry Configuration (for error monitoring)
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  
  // Feature Flags
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  
  // Development Configuration
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  
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
