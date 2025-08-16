const path = require('path');

// Try to load .env file if it exists, but don't fail if it doesn't
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (error) {
  console.log('No .env file found, using default values');
}

// Get environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  return process.env[key] || fallback;
};

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.clubcorra.com';
  }
  
  // Development - use environment variable or fallback to localhost
  return getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:3001');
};

// Get WebSocket URL (should be the base server URL, not the API endpoint)
const getWsUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.clubcorra.com';
  }
  
  // Development - use environment variable or fallback to localhost
  return getEnvVar('EXPO_PUBLIC_WS_URL', 'http://localhost:3001');
};

module.exports = {
  expo: {
    name: "Club Corra",
    slug: "club-corra-pilot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F0F23"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.clubcorra.mobile",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "localhost": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "1.0"
            },
            "127.0.0.1": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "1.0"
            },
            // Allow local network access for development
            "192.168.0.0/16": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: "1.0"
            }
          }
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F0F23"
      },
      package: "com.clubcorra.mobile",
      usesCleartextTraffic: true,
      networkSecurityConfig: {
        domainConfig: {
          "localhost": {
            cleartextTrafficPermitted: true
          },
          "127.0.0.1": {
            cleartextTrafficPermitted: true
          },
          // Allow local network access for development
          "192.168.0.0/16": {
            cleartextTrafficPermitted: true
          }
        }
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "clubcorra"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      // Temporarily disable expo-notifications for development to avoid warnings
      // [
      //   "expo-notifications",
      //   {
      //     icon: "./assets/icon.png",
      //     color: "#0F0F23",
      //     sounds: []
      //   }
      // ]
    ],
    scheme: "clubcorra",
    // Environment variables
    extra: {
      eas: {
        projectId: "c822a055-500c-4010-8669-9dd8530719dc"
      },
      apiBaseUrl: getBaseUrl(),
      wsUrl: getWsUrl(),
      cdnUrl: getEnvVar('EXPO_PUBLIC_CDN_URL', 'https://cdn.clubcorra.com'),
      environment: process.env.NODE_ENV || 'development',
      debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true'
    }
  }
};
