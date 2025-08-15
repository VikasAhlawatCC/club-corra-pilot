# Club Corra API Server

## Environment Configuration

Create a `.env` file in the `apps/api` directory with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/clubcorra
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,exp://localhost:8081

# S3 Configuration (for file uploads)
S3_BUCKET=clubcorra-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_URL=https://cdn.clubcorra.com

# Sentry Configuration (for error monitoring)
SENTRY_DSN=

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (for OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Development Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up the database:
   ```bash
   # Create database
   createdb clubcorra
   
   # Run migrations
   yarn migration:run
   ```

3. Start the development server:
   ```bash
   yarn start:dev
   ```

## WebSocket Configuration

The API server includes a WebSocket gateway for real-time updates:

- **Path**: `/socket.io`
- **CORS**: Configured to allow mobile app connections
- **Events**: Supports ping/pong, user registration, and real-time updates

## API Endpoints

- **Health Check**: `GET /api/v1/health`
- **Authentication**: `POST /api/v1/auth/*`
- **Users**: `GET/POST/PUT/DELETE /api/v1/users/*`
- **Brands**: `GET/POST/PUT/DELETE /api/v1/brands/*`
- **Coins**: `GET/POST/PUT/DELETE /api/v1/coins/*`

## Troubleshooting

### WebSocket Connection Issues

If the mobile app can't connect to WebSocket:

1. **Check if server is running**: Ensure `yarn start:dev` is running
2. **Check CORS configuration**: Verify allowed origins in `.env`
3. **Check network access**: Ensure mobile device can reach the server IP
4. **Check firewall**: Ensure port 3001 is accessible

### Database Connection Issues

1. **Check PostgreSQL**: Ensure database is running and accessible
2. **Check connection string**: Verify DATABASE_URL format
3. **Run migrations**: Ensure database schema is up to date

### CORS Issues

1. **Check allowed origins**: Verify ALLOWED_ORIGINS in `.env`
2. **Check mobile app URL**: Ensure mobile app is using allowed origin
3. **Restart server**: CORS changes require server restart
