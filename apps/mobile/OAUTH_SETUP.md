# OAuth Setup Guide for Club Corra Mobile App

## Overview
This guide explains how to set up Google OAuth authentication for the Club Corra mobile app.

## Prerequisites
- Google Cloud Console account
- Expo development environment
- Club Corra backend API running

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Club Corra"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users if needed

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Android" as application type
4. Fill in the details:
   - Package name: `com.clubcorra.mobile`
   - SHA-1 certificate fingerprint: Get this from your keystore

### 1.4 Get SHA-1 Certificate Fingerprint

#### For Development (Debug):
```bash
cd apps/mobile
npx expo fetch:android:hashes
```

#### For Production (Release):
```bash
cd apps/mobile
npx expo fetch:android:hashes --type release
```

## Step 2: Environment Configuration

### 2.1 Copy Environment Template
```bash
cd apps/mobile
cp .env.example .env
```

### 2.2 Update Environment Variables
Edit `.env` file and replace the placeholder values:

```env
# OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
EXPO_PUBLIC_GOOGLE_REDIRECT_URI=clubcorra://auth/callback

# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.4:3001
```

## Step 3: Expo Configuration

### 3.1 Verify App Scheme
The app scheme is already configured in `app.json`:
```json
{
  "expo": {
    "scheme": "clubcorra"
  }
}
```

### 3.2 Update Android Intent Filters
The Android intent filters are already configured in `app.json` for deep linking.

## Step 4: Backend Integration

### 4.1 Verify Backend Endpoints
Ensure your backend has these OAuth endpoints:
- `POST /auth/oauth/signup` - For OAuth registration
- `POST /auth/login/oauth` - For OAuth login

### 4.2 Backend OAuth Flow
The backend should:
1. Receive the authorization code from mobile app
2. Exchange it for access tokens using Google's token endpoint
3. Fetch user information from Google
4. Create or authenticate the user
5. Return JWT tokens

## Step 5: Testing OAuth Flow

### 5.1 Test Configuration
```bash
cd apps/mobile
yarn test src/services/oauth.service.test.ts
```

### 5.2 Test OAuth Service
```bash
yarn test src/services/__tests__/oauth.service.test.ts
```

### 5.3 Manual Testing
1. Start the mobile app
2. Navigate to authentication flow
3. Select "Continue with Google"
4. Complete Google OAuth flow
5. Verify successful authentication

## Troubleshooting

### Common Issues

#### 1. "OAuth is not properly configured"
- Check that `.env` file exists and has correct values
- Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set
- Ensure the client ID is not the placeholder value

#### 2. "Invalid redirect URI"
- Verify the redirect URI matches exactly: `clubcorra://auth/callback`
- Check that the app scheme is `clubcorra` in `app.json`
- Ensure the redirect URI is added to Google Cloud Console

#### 3. "Authentication failed"
- Check network connectivity
- Verify backend OAuth endpoints are working
- Check backend logs for OAuth errors

#### 4. "SHA-1 fingerprint mismatch"
- Regenerate SHA-1 fingerprint
- Update Google Cloud Console credentials
- Use correct keystore (debug vs release)

### Debug Steps
1. Check environment variables are loaded:
   ```typescript
   console.log('Google Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
   console.log('Redirect URI:', process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI);
   ```

2. Verify OAuth service configuration:
   ```typescript
   console.log('OAuth configured:', oauthService.isConfigured());
   console.log('Config validation:', oauthService.validateConfiguration());
   ```

3. Check backend OAuth endpoints are accessible

## Security Considerations

### 1. Client ID Exposure
- The Google Client ID is public and safe to expose
- Never expose client secrets in mobile apps
- Use proper OAuth flow (authorization code, not implicit)

### 2. Token Security
- JWT tokens are stored securely in AsyncStorage
- Tokens are automatically refreshed
- Implement proper token expiration handling

### 3. Deep Link Security
- The `clubcorra://` scheme is app-specific
- Validate all deep link parameters
- Implement proper URL validation

## Production Deployment

### 1. Update Environment Variables
- Set production API base URL
- Use production Google OAuth credentials
- Configure production CDN and Sentry

### 2. Update Google Cloud Console
- Add production package name and SHA-1
- Update OAuth consent screen for production
- Remove test users

### 3. Test Production Flow
- Test OAuth flow with production credentials
- Verify deep linking works in production
- Test token refresh and session management

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review Google Cloud Console logs
3. Check backend OAuth endpoint logs
4. Verify environment configuration
5. Test with minimal configuration first
