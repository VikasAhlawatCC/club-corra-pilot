# Quick Server IP Switching

This system allows you to quickly switch between different server IP addresses during development without manually editing configuration files.

## Quick Commands

Switch to different server configurations:

```bash
# Using npm/yarn scripts (recommended)
yarn switch:localhost    # Switch to localhost:3001
yarn switch:home         # Switch to 192.168.1.4:3001
yarn switch:office       # Switch to 192.168.0.100:3001
yarn switch:hotspot      # Switch to 192.168.43.100:3001
yarn switch:production   # Switch to production server

# List all available configurations
yarn switch:list

# Using the script directly
node scripts/switch-server.js localhost
node scripts/switch-server.js home
node scripts/switch-server.js office
node scripts/switch-server.js hotspot
node scripts/switch-server.js production
node scripts/switch-server.js list
```

## Available Configurations

| Name | API URL | Description |
|------|---------|-------------|
| `localhost` | `http://localhost:3001` | Local development server |
| `home` | `http://192.168.1.4:3001` | Home WiFi network |
| `office` | `http://192.168.0.100:3001` | Office WiFi network |
| `hotspot` | `http://192.168.43.100:3001` | Phone hotspot network |
| `production` | `https://api.clubcorra.com` | Production server |

## How It Works

1. **Configuration File**: `src/config/server-config.ts` contains all server configurations
2. **Active Config**: The `ACTIVE_CONFIG` constant determines which configuration is currently active
3. **Environment Integration**: `src/config/environment.ts` uses the active configuration
4. **Script**: `scripts/switch-server.js` updates the active configuration

## Adding New Configurations

To add a new server configuration:

1. Edit `src/config/server-config.ts`
2. Add your new configuration to the `SERVER_CONFIGS` object
3. Add a new script to `package.json` if desired

Example:
```typescript
// In server-config.ts
cafe: {
  name: 'Cafe WiFi',
  apiBaseUrl: 'http://10.0.0.50:3001',
  wsUrl: 'http://10.0.0.50:3001',
  description: 'Cafe WiFi network'
}

// In package.json
"switch:cafe": "node scripts/switch-server.js cafe"
```

## Important Notes

- **Restart Required**: After switching configurations, restart your Expo development server
- **Network Access**: Ensure your device can access the target IP address
- **Port Forwarding**: Some networks may require port forwarding for external access
- **Security**: Only use this for development; production should use proper domain names

## Troubleshooting

### Can't connect to server?
1. Check if the server is running on the target IP
2. Verify network connectivity (ping the IP)
3. Check firewall settings
4. Ensure the port (3001) is accessible

### Configuration not updating?
1. Make sure you're editing the correct file
2. Restart the Expo development server
3. Clear Metro cache: `yarn start --clear`

### IP address changed?
Update the configuration in `src/config/server-config.ts` with the new IP address.
