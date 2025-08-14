# Club Corra API

This is the NestJS backend API for the Club Corra application, implementing comprehensive user authentication and management.

## Features

- **User Authentication**: Mobile number + OTP verification, email verification, OAuth 2.0 support
- **User Management**: Profile management, payment details, account status
- **OTP System**: Secure OTP generation and verification for mobile and email
- **SMS Integration**: Twilio integration for OTP delivery
- **Email Integration**: SMTP integration for OTP and notifications
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Database**: PostgreSQL with TypeORM, proper migrations

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Yarn package manager

## Installation

1. Install dependencies:
```bash
yarn install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables (see Environment Variables section)

4. Run database migrations:
```bash
yarn migration:run
```

5. Start the development server:
```bash
yarn start:dev
```

## Environment Variables

Create a `.env` file in the `apps/api` directory with the following variables:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@localhost:5432/club_corra_db
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
```

### Twilio SMS Configuration
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### SMTP Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=noreply@clubcorra.com
```

### OAuth Configuration
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### Application Configuration
```
NODE_ENV=development
PORT=3001
```

## API Endpoints

### Authentication

#### User Signup
```
POST /api/v1/auth/signup
```

**Request Body:**
```json
{
  "mobileNumber": "+1234567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

#### OAuth Signup
```
POST /api/v1/auth/oauth/signup
```

**Request Body:**
```json
{
  "mobileNumber": "+1234567890",
  "oauthProvider": "google",
  "oauthToken": "google_access_token",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Request OTP
```
POST /api/v1/auth/request-otp
```

**Request Body:**
```json
{
  "mobileNumber": "+1234567890",
  "type": "mobile"
}
```

#### Verify OTP
```
POST /api/v1/auth/verify-otp
```

**Request Body:**
```json
{
  "mobileNumber": "+1234567890",
  "code": "123456",
  "type": "mobile"
}
```

#### Mobile Login
```
POST /api/v1/auth/login/mobile
```

**Request Body:**
```json
{
  "mobileNumber": "+1234567890",
  "otpCode": "123456"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### User Management

#### Get Profile
```
GET /api/v1/users/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```
PUT /api/v1/users/profile
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

#### Update Payment Details
```
PUT /api/v1/users/payment-details
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "upiId": "user@upi",
  "preferredMethod": "upi"
}
```

## Database Schema

The API uses the following main entities:

- **users**: Core user information and authentication status
- **user_profiles**: User profile details (name, DOB, address, etc.)
- **payment_details**: Payment method preferences and UPI details
- **auth_providers**: OAuth provider connections
- **otps**: OTP codes for verification

## Development

### Running Migrations

Generate a new migration:
```bash
yarn migration:generate -- -n MigrationName
```

Run migrations:
```bash
yarn migration:run
```

Revert last migration:
```bash
yarn migration:revert
```

### Testing

Run tests:
```bash
yarn test
```

Run tests in watch mode:
```bash
yarn test:watch
```

### Building

Build for production:
```bash
yarn build
```

Start production server:
```bash
yarn start:prod
```

## Security Features

- OTP expiration and rate limiting
- JWT token rotation with refresh tokens
- Secure password hashing with bcrypt
- Input validation and sanitization
- CORS configuration for authorized domains
- Rate limiting for authentication attempts

## Integration Points

- **SMS Service**: Twilio for OTP delivery
- **Email Service**: SMTP for OTP and notifications
- **OAuth Providers**: Google, Facebook, Apple
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js

## Notes

- Mobile number verification is mandatory for all users
- Email verification is required (either via OTP or OAuth)
- OAuth users still need mobile number verification
- Payment details are optional and can be completed later
- All sensitive data is hashed before storage
- JWT tokens have different expiration times for mobile vs web
