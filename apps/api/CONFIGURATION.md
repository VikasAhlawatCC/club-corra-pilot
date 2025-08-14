# API Configuration Guide

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/club_corra
```

### JWT Configuration
```bash
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
```

### SMS Service (Twilio)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Email Service (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@clubcorra.com
```

### OAuth Configuration
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### Application Configuration
```bash
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001/api/v1
```

### Security
```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=300000
```

### Logging
```bash
LOG_LEVEL=debug
SENTRY_DSN=your-sentry-dsn-if-using
```

## Setup Instructions

1. Copy this configuration to a `.env` file in the `apps/api` directory
2. Fill in your actual values for each service
3. Ensure all required variables are set before starting the application
4. For production, use strong, unique secrets for JWT keys

## Security Notes

- Never commit `.env` files to version control
- Use strong, randomly generated secrets for JWT keys
- Rotate secrets regularly in production
- Use environment-specific configurations for different deployment environments
