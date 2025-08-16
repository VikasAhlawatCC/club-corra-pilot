#!/usr/bin/env node

/**
 * Quick Server Configuration Switcher
 * 
 * Usage:
 *   node scripts/switch-server.js localhost
 *   node scripts/switch-server.js home
 *   node scripts/switch-server.js office
 *   node scripts/switch-server.js hotspot
 *   node scripts/switch-server.js production
 *   node scripts/switch-server.js list
 */

const fs = require('fs');
const path = require('path');

const SERVER_CONFIGS = {
  localhost: {
    name: 'Localhost',
    apiBaseUrl: 'http://localhost:3001',
    wsUrl: 'http://localhost:3001',
    description: 'Local development server'
  },
  home: {
    name: 'Home Network',
    apiBaseUrl: 'http://192.168.1.4:3001',
    wsUrl: 'http://192.168.1.4:3001',
    description: 'Home WiFi network'
  },
  office: {
    name: 'Office Network',
    apiBaseUrl: 'http://192.168.0.100:3001',
    wsUrl: 'http://192.168.0.100:3001',
    description: 'Office WiFi network'
  },
  hotspot: {
    name: 'Phone Hotspot',
    apiBaseUrl: 'http://192.168.43.100:3001',
    wsUrl: 'http://192.168.43.100:3001',
    description: 'Phone hotspot network'
  },
  production: {
    name: 'Production',
    apiBaseUrl: 'https://api.clubcorra.com',
    wsUrl: 'https://api.clubcorra.com',
    description: 'Production server'
  }
};

function updateServerConfig(selectedConfig) {
  const configPath = path.join(__dirname, '../src/config/server-config.ts');
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Update the ACTIVE_CONFIG line
    const regex = /export const ACTIVE_CONFIG = ['"`][^'"`]+['"`];/;
    const replacement = `export const ACTIVE_CONFIG = '${selectedConfig}';`;
    
    if (content.includes('ACTIVE_CONFIG')) {
      content = content.replace(regex, replacement);
    } else {
      throw new Error('Could not find ACTIVE_CONFIG in server-config.ts');
    }
    
    fs.writeFileSync(configPath, content, 'utf8');
    
    console.log(`✅ Successfully switched to ${selectedConfig} configuration`);
    console.log(`📡 API Base URL: ${SERVER_CONFIGS[selectedConfig].apiBaseUrl}`);
    console.log(`🔌 WebSocket URL: ${SERVER_CONFIGS[selectedConfig].wsUrl}`);
    console.log(`📝 Description: ${SERVER_CONFIGS[selectedConfig].description}`);
    console.log('\n🔄 Restart your Expo development server for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
    process.exit(1);
  }
}

function listConfigs() {
  console.log('Available server configurations:\n');
  
  Object.entries(SERVER_CONFIGS).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(12)} - ${config.name}`);
    console.log(`    ${' '.repeat(12)}   ${config.apiBaseUrl}`);
    console.log(`    ${' '.repeat(12)}   ${config.description}\n`);
  });
  
  console.log('Usage: node scripts/switch-server.js <config-name>');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please specify a configuration to switch to');
    console.log('Usage: node scripts/switch-server.js <config-name>');
    console.log('Use "list" to see available configurations');
    process.exit(1);
  }
  
  const selectedConfig = args[0].toLowerCase();
  
  if (selectedConfig === 'list') {
    listConfigs();
    return;
  }
  
  if (!SERVER_CONFIGS[selectedConfig]) {
    console.log(`❌ Unknown configuration: ${selectedConfig}`);
    console.log('Use "list" to see available configurations');
    process.exit(1);
  }
  
  updateServerConfig(selectedConfig);
}

if (require.main === module) {
  main();
}
