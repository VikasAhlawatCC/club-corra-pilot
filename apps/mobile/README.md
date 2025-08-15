# Club Corra Mobile App

## Environment Configuration

The mobile app uses environment variables for configuration. Create a `.env` file in the `apps/mobile` directory with the following variables:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=http://localhost:3001

# CDN Configuration
EXPO_PUBLIC_CDN_URL=https://cdn.clubcorra.com

# Environment
NODE_ENV=development
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG_MODE=true

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=false

# Sentry (for production)
EXPO_PUBLIC_SENTRY_DSN=
```

## Development Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn start
   ```

3. Run on device/simulator:
   ```bash
   yarn ios
   yarn android
   ```

## Configuration Notes

- The app automatically detects the environment and uses appropriate API endpoints
- For local development, use `localhost:3001` for the API
- For network testing on physical devices, use your local network IP (e.g., `192.168.1.x:3001`)
- The app.config.js file handles environment-specific configurations
- CORS is configured to allow local network access for development

## Troubleshooting

If you encounter routing issues:
1. Clear Metro cache: `yarn start --clear`
2. Restart the development server
3. Check that all route files have proper default exports
4. Verify environment variables are set correctly
