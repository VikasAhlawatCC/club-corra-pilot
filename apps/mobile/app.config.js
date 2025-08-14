const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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
            "192.168.1.5": {
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
          "192.168.1.5": {
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
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#0F0F23",
          sounds: []
        }
      ]
    ],
    scheme: "clubcorra",
    // Environment variables
    extra: {
      eas: {
        projectId: "c822a055-500c-4010-8669-9dd8530719dc"
      },
      apiBaseUrl: 'http://192.168.1.5:3001',
      wsUrl: 'http://192.168.1.5:3001',
      cdnUrl: 'https://cdn.clubcorra.com',
      environment: 'development',
      debugMode: true
      // apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      // wsUrl: process.env.EXPO_PUBLIC_WS_URL,
      // cdnUrl: process.env.EXPO_PUBLIC_CDN_URL,
      // environment: process.env.NODE_ENV || 'development',
      // debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true'
    }
  }
};
