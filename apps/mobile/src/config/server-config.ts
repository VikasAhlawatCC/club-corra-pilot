// Server Configuration for Development
// Modify this file to quickly switch between different server IPs

export const SERVER_CONFIGS = {
  // Local development
  localhost: {
    name: 'Localhost',
    apiBaseUrl: 'http://localhost:3001',
    wsUrl: 'http://localhost:3001',
    description: 'Local development server'
  },
  
  // Home network (192.168.1.x)
  home: {
    name: 'Home Network',
    apiBaseUrl: 'http://192.168.1.4:3001',
    wsUrl: 'http://192.168.1.4:3001',
    description: 'Home WiFi network'
  },
  
  // Office network (different IP range)
  office: {
    name: 'Office Network',
    apiBaseUrl: 'http://192.168.0.100:3001',
    wsUrl: 'http://192.168.0.100:3001',
    description: 'Office WiFi network'
  },
  
  // Hotspot from phone
  hotspot: {
    name: 'Phone Hotspot',
    apiBaseUrl: 'http://192.168.43.100:3001',
    wsUrl: 'http://192.168.43.100:3001',
    description: 'Phone hotspot network'
  },
  
  // Production
  production: {
    name: 'Production',
    apiBaseUrl: 'https://api.clubcorra.com',
    wsUrl: 'https://api.clubcorra.com',
    description: 'Production server'
  }
};

// Current active configuration
// Change this to quickly switch servers
export const ACTIVE_CONFIG = 'localhost'; // Options: 'localhost', 'home', 'office', 'hotspot', 'production'

// Helper function to get current config
export const getCurrentConfig = () => {
  return SERVER_CONFIGS[ACTIVE_CONFIG as keyof typeof SERVER_CONFIGS] || SERVER_CONFIGS.home;
};

// Helper function to switch configs
export const switchConfig = (configName: keyof typeof SERVER_CONFIGS) => {
  console.log(`Switching to ${configName} configuration:`, SERVER_CONFIGS[configName]);
  return SERVER_CONFIGS[configName];
};

// Quick switch functions
export const switchToLocalhost = () => switchConfig('localhost');
export const switchToHome = () => switchConfig('home');
export const switchToOffice = () => switchConfig('office');
export const switchToHotspot = () => switchConfig('hotspot');
export const switchToProduction = () => switchConfig('production');
