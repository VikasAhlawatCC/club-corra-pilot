# Club Corra API Endpoints Specification

## Overview

This document outlines all the API endpoints for the Club Corra system, including request/response schemas, validation rules, and business logic for each endpoint. This specification is based on the current implementation and aligns with the Feature 0004 plan.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.clubcorra.com`

## Authentication

All endpoints (except public ones) require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Implementation Status

### ✅ Fully Implemented
- Authentication endpoints (signup, login, OTP)
- **NEW**: Complete new auth flow (initial signup, OTP verification, password setup, email verification)
- **NEW**: Complete mobile app integration with new auth flow
- Basic brand management
- File upload system
- Health checks
- Global configuration management
- Basic notification system
- WebSocket infrastructure

### 🔄 Partially Implemented
- Coin transaction system (basic structure exists, business logic incomplete)
- Admin transaction management (endpoints exist but not fully functional)
- User profile management

### ❌ Not Yet Implemented
- Complete transaction approval/rejection workflow
- Payment processing system
- Real-time balance updates
- Advanced transaction validation

## API Endpoints

### 1. Authentication Endpoints

#### 1.1 New Auth Flow - Initial Signup
- **Endpoint**: `POST /auth/signup/initial`
- **Status**: ✅ **NEW** - Fully Implemented
- **Description**: First step of new signup flow - collect user name and mobile number
- **Request Schema**:
```typescript
{
  firstName: string; // Required, 2-50 characters
  lastName: string;  // Required, 2-50 characters
  mobileNumber: string; // Required, valid Indian mobile number
}
```
- **Response Schema**:
```typescript
{
  message: string;
  mobileNumber: string;
  requiresOtpVerification: boolean;
  existingUserMessage?: string; // Only if user already exists
  redirectToLogin?: boolean;    // Only if user already exists
}
```
- **Business Logic**: ✅ Creates user in PENDING status, sends OTP, handles existing users

#### 1.2 New Auth Flow - OTP Verification
- **Endpoint**: `POST /auth/signup/verify-otp`
- **Status**: ✅ **NEW** - Fully Implemented
- **Description**: Second step - verify OTP and prepare for password setup
- **Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  otpCode: string;      // Required, 4-6 digits
}
```
- **Response Schema**:
```typescript
{
  message: string;
  userId: string;
  requiresPasswordSetup: boolean;
}
```
- **Business Logic**: ✅ Verifies OTP, marks mobile as verified, prepares for password setup

#### 1.3 New Auth Flow - Password Setup
- **Endpoint**: `POST /auth/signup/setup-password`
- **Status**: ✅ **NEW** - Fully Implemented
- **Description**: Third step - set user password and optionally activate account
- **Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  password: string;     // Required, min 8 chars, must contain lowercase, uppercase, number
  confirmPassword: string; // Required, must match password
}
```
- **Response Schema**:
```typescript
{
  message: string;
  userId: string;
  requiresEmailVerification: boolean;
  accessToken?: string;      // Only if account activated
  refreshToken?: string;     // Only if account activated
  expiresIn?: number;        // Only if account activated
}
```
- **Business Logic**: ✅ Sets password, activates account if no email, generates tokens if activated

#### 1.4 New Auth Flow - Add Email (Optional)
- **Endpoint**: `POST /auth/signup/add-email`
- **Status**: ✅ **NEW** - Fully Implemented
- **Description**: Fourth step - optionally add email to account
- **Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  email: string;        // Required, valid email format
}
```
- **Response Schema**:
```typescript
{
  message: string;
  userId: string;
  requiresEmailVerification: boolean;
}
```
- **Business Logic**: ✅ Adds email, sends verification OTP, prevents duplicate usage

#### 1.5 New Auth Flow - Email Verification
- **Endpoint**: `POST /auth/signup/verify-email`
- **Status**: ✅ **NEW** - Fully Implemented
- **Description**: Final step - verify email and activate account
- **Request Schema**:
```typescript
{
  token: string; // Required, email verification token
}
```
- **Response Schema**:
```typescript
{
  message: string;
  userId: string;
  accountActivated: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```
- **Business Logic**: ✅ Verifies email, activates account, generates authentication tokens

#### 1.6 User Signup (Legacy)
- **Endpoint**: `POST /auth/signup`
- **Status**: ✅ Implemented (Legacy - use new flow instead)
- **Description**: Legacy signup endpoint - maintained for backward compatibility

#### 1.7 OAuth Signup
- **Endpoint**: `POST /auth/oauth/signup`
- **Status**: ✅ Implemented
- **Description**: Create new user account via OAuth provider
- **Request Schema**:
```typescript
{
  mobileNumber: string;
  oauthProvider: 'GOOGLE' | 'FACEBOOK';
  oauthToken: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}
```

#### 1.8 Request OTP
- **Endpoint**: `POST /auth/request-otp`
- **Status**: ✅ Implemented
- **Description**: Request OTP for mobile or email verification
- **Request Schema**:
```typescript
{
  mobileNumber?: string; // Required for SMS OTP
  email?: string; // Required for email OTP
  type: 'SMS' | 'EMAIL';
}
```

#### 1.9 Verify OTP
- **Endpoint**: `POST /auth/verify-otp`
- **Status**: ✅ Implemented
- **Description**: Verify OTP code for authentication
- **Request Schema**:
```typescript
{
  mobileNumber?: string; // Required for SMS verification
  email?: string; // Required for email verification
  code: string; // 4-6 digits
  type: 'SMS' | 'EMAIL';
}
```

#### 1.10 Mobile Login
- **Endpoint**: `POST /auth/login/mobile`
- **Status**: ✅ Implemented
- **Description**: Authenticate user with mobile number and OTP
- **Request Schema**:
```typescript
{
  mobileNumber: string;
  otpCode: string; // 4-6 digits
}
```

#### 1.11 Email Login
- **Endpoint**: `POST /auth/login/email`
- **Status**: ✅ Implemented
- **Description**: Authenticate user with email and password
- **Request Schema**:
```typescript
{
  email: string;
  password: string; // Min 6 characters
}
```

#### 1.12 OAuth Login
- **Endpoint**: `POST /auth/login/oauth`
- **Status**: ✅ Implemented
- **Description**: Authenticate user via OAuth provider
- **Request Schema**:
```typescript
{
  provider: 'GOOGLE' | 'FACEBOOK';
  accessToken: string;
}
```

#### 1.13 Refresh Token
- **Endpoint**: `POST /auth/refresh-token`
- **Status**: ✅ Implemented
- **Description**: Refresh expired access token
- **Request Schema**:
```typescript
{
  refreshToken: string;
}
```

#### 1.14 Logout
- **Endpoint**: `POST /auth/logout`
- **Status**: ✅ Implemented
- **Description**: Logout user (token blacklisting not yet implemented)

### 2. New Authentication Flow

The new authentication flow provides a more user-friendly and secure signup process with the following benefits:

- **Progressive Account Setup**: Users complete their account in logical steps
- **Better User Experience**: Clear progression through the signup process
- **Enhanced Security**: Password setup integrated with verification flow
- **Flexible Email**: Optional email verification step
- **Existing User Handling**: Smart handling of incomplete accounts

#### Flow Overview
```
1. Initial Signup (Name + Number) → 2. OTP Verification → 3. Password Setup → 4. Optional Email Verification → 5. Main App
```

#### User Status Management
- **PENDING**: Basic account created, mobile verified, password may or may not be set
- **ACTIVE**: Mobile verified, password set, ready for full app access

#### Business Rules
1. **Account Activation**: User must have mobile verified + password set to be ACTIVE
2. **Email Verification**: Optional but recommended for account security
3. **Existing Users**: Smart handling of incomplete accounts with OTP regeneration
4. **Password Requirements**: Minimum 8 characters with lowercase, uppercase, and number
5. **OTP Security**: 4-6 digit codes with 5-minute expiration

#### Integration Points
- **Mobile App**: Progressive flow screens with clear navigation
- **Backend Services**: Orchestrated flow with proper state management
- **Database**: User status tracking and verification state management
- **Security**: JWT tokens generated only after account activation

### 3. Coin Transaction Endpoints

#### 2.1 Submit Earn Request
- **Endpoint**: `POST /coins/transactions/earn`
- **Status**: 🔄 Partially Implemented (basic structure exists)
- **Description**: Submit bill for earning coins
- **Request Schema**:
```typescript
{
  brandId: string; // UUID
  billAmount: number; // Min 0.01, Max 100,000
  billDate: string; // ISO date string, must not be in future
  receiptUrl: string; // Valid URL
  notes?: string; // Optional, max 500 chars
}
```
- **Response Schema**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    transaction: {
      id: string;
      type: 'EARN';
      status: 'PENDING';
      billAmount: number;
      coinsEarned: number; // Calculated based on brand percentage
      brand: BrandInfo;
      createdAt: Date;
    };
  };
}
```
- **Business Logic**: ✅ Coins immediately added to balance, transaction created with PENDING status

#### 2.2 Submit Redemption Request
- **Endpoint**: `POST /coins/transactions/redeem`
- **Status**: 🔄 Partially Implemented (basic structure exists)
- **Description**: Request coin redemption for bill payment
- **Request Schema**:
```typescript
{
  brandId: string; // UUID
  billAmount: number; // Min 0.01, Max 100,000
  coinsToRedeem: number; // Min 1, must not exceed available balance
  notes?: string; // Optional, max 500 chars
}
```
- **Response Schema**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    transaction: {
      id: string;
      type: 'REDEEM';
      status: 'PENDING';
      billAmount: number;
      coinsRedeemed: number;
      brand: BrandInfo;
      createdAt: Date;
    };
  };
}
```
- **Business Logic**: ✅ Balance validation, brand limits validation, transaction created with PENDING status

#### 2.3 Get Transaction History
- **Endpoint**: `GET /coins/transactions`
- **Status**: ✅ Implemented
- **Description**: Get user's transaction history with filtering
- **Query Parameters**:
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}
```
- **Response Schema**:
```typescript
{
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### 2.4 Get My Transactions
- **Endpoint**: `GET /coins/transactions/my`
- **Status**: ✅ Implemented
- **Description**: Get current user's transactions (alias for /coins/transactions)

### 3. Admin Management Endpoints

#### 3.1 Create Welcome Bonus
- **Endpoint**: `POST /admin/coins/welcome-bonus`
- **Status**: ✅ Implemented
- **Description**: Admin creates welcome bonus for user
- **Request Schema**:
```typescript
{
  userId: string; // UUID
  mobileNumber: string; // Min 10 digits
}
```
- **Response Schema**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    coinsAwarded: number; // Always 100
    newBalance: number;
  };
}
```
- **Business Logic**: ✅ 100 coins awarded, balance updated, real-time notification sent

#### 3.2 Get User Balance (Admin)
- **Endpoint**: `GET /admin/coins/balance/:userId`
- **Status**: ✅ Implemented
- **Description**: Admin gets user's coin balance

#### 3.3 Get User Transaction Summary (Admin)
- **Endpoint**: `GET /admin/coins/summary/:userId`
- **Status**: ✅ Implemented
- **Description**: Admin gets user's transaction summary and recent transactions

#### 3.4 List All Transactions (Admin)
- **Endpoint**: `GET /admin/coins/transactions`
- **Status**: 🔄 Partially Implemented (endpoint exists but returns empty results)
- **Description**: Get all transactions with admin filtering
- **Query Parameters**:
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20
  userId?: string; // Optional user filter
}
```

#### 3.5 Get Pending Transactions (Admin)
- **Endpoint**: `GET /admin/coins/transactions/pending`
- **Status**: 🔄 Partially Implemented (endpoint exists but returns empty results)
- **Description**: Get count and list of pending requests by type

#### 3.6 Approve Transaction (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/approve`
- **Status**: ❌ Not Implemented (endpoint exists but returns "not implemented")
- **Description**: Approve earn/redemption request
- **Request Schema**:
```typescript
{
  adminNotes?: string; // Optional, max 1000 chars
}
```

#### 3.7 Reject Transaction (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/reject`
- **Status**: ❌ Not Implemented (endpoint exists but returns "not implemented")
- **Description**: Reject request with notes
- **Request Schema**:
```typescript
{
  reason: string; // Required rejection reason, max 500 chars
  adminNotes?: string; // Optional, max 1000 chars
}
```

#### 3.8 Process Payment (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/process-payment`
- **Status**: ❌ Not Implemented (endpoint exists but returns "not implemented")
- **Description**: Mark redemption as paid with admin transaction ID
- **Request Schema**:
```typescript
{
  transactionId: string; // Admin's payment transaction ID, 5-100 chars
  adminNotes?: string; // Optional, max 1000 chars
}
```

### 4. Brand Management Endpoints

#### 4.1 Create Brand
- **Endpoint**: `POST /brands`
- **Status**: ✅ Implemented
- **Description**: Create new brand with earning/redemption rules
- **Request Schema**:
```typescript
{
  name: string; // Max 200 chars
  description: string;
  logoUrl?: string; // Valid URL
  categoryId: string; // UUID
  earningPercentage: number; // 0-100, default 30
  redemptionPercentage: number; // 0-100, default 100
  minRedemptionAmount?: number; // Min 0
  maxRedemptionAmount?: number; // Min 0
  overallMaxCap?: number; // Default 2000
  brandwiseMaxCap?: number; // Default 2000
}
```

#### 4.2 Update Brand
- **Endpoint**: `PATCH /brands/:id`
- **Status**: ✅ Implemented
- **Description**: Update existing brand configuration

#### 4.3 List Brands
- **Endpoint**: `GET /brands`
- **Status**: ✅ Implemented
- **Description**: Get all brands with filtering
- **Query Parameters**:
```typescript
{
  query?: string; // Search by name, max 200 chars
  categoryId?: string; // UUID
  isActive?: boolean;
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}
```

#### 4.4 Get Active Brands
- **Endpoint**: `GET /brands/active`
- **Status**: ✅ Implemented
- **Description**: Get all active brands

#### 4.5 Get Brands by Category
- **Endpoint**: `GET /brands/category/:categoryId`
- **Status**: ✅ Implemented
- **Description**: Get brands filtered by category

#### 4.6 Get Brand by ID
- **Endpoint**: `GET /brands/:id`
- **Status**: ✅ Implemented
- **Description**: Get specific brand details

#### 4.7 Toggle Brand Status
- **Endpoint**: `PATCH /brands/:id/toggle-status`
- **Status**: ✅ Implemented
- **Description**: Activate/deactivate brand

#### 4.8 Delete Brand
- **Endpoint**: `DELETE /brands/:id`
- **Status**: ✅ Implemented
- **Description**: Delete brand (cannot delete if has transactions)

### 5. Global Configuration Endpoints

#### 5.1 Get All Configurations
- **Endpoint**: `GET /config`
- **Status**: ✅ Implemented
- **Description**: Get all global configuration values

#### 5.2 Get Configurations by Category
- **Endpoint**: `GET /config/category/:category`
- **Status**: ✅ Implemented
- **Description**: Get configurations filtered by category
- **Categories**: 'brand', 'user', 'transaction', 'security', 'system', 'file'

#### 5.3 Get Transaction Configs
- **Endpoint**: `GET /config/transaction`
- **Status**: ✅ Implemented
- **Description**: Get transaction-specific configurations

#### 5.4 Get Brand Configs
- **Endpoint**: `GET /config/brand`
- **Status**: ✅ Implemented
- **Description**: Get brand-specific configurations

#### 5.5 Get User Configs
- **Endpoint**: `GET /config/user`
- **Status**: ✅ Implemented
- **Description**: Get user-specific configurations

#### 5.6 Get Security Configs
- **Endpoint**: `GET /config/security`
- **Status**: ✅ Implemented
- **Description**: Get security-specific configurations

#### 5.7 Update Configuration
- **Endpoint**: `PUT /config/:key`
- **Status**: ✅ Implemented
- **Description**: Update specific configuration value
- **Request Schema**:
```typescript
{
  value: string | number | boolean | object;
}
```

#### 5.8 Initialize Default Configs
- **Endpoint**: `GET /config/initialize-defaults`
- **Status**: ✅ Implemented
- **Description**: Initialize default configuration values

#### 5.9 Clear Config Cache
- **Endpoint**: `GET /config/cache/clear`
- **Status**: ✅ Implemented
- **Description**: Clear configuration cache

### 6. User Management Endpoints

#### 6.1 Get User Profile
- **Endpoint**: `GET /users/profile`
- **Status**: ✅ Implemented
- **Description**: Get current user's profile and information

#### 6.2 Update User Profile
- **Endpoint**: `PUT /users/profile`
- **Status**: ✅ Implemented
- **Description**: Update user profile information
- **Request Schema**:
```typescript
{
  firstName?: string; // Max 50 chars, letters and spaces only
  lastName?: string; // Max 50 chars, letters and spaces only
  dateOfBirth?: Date; // User must be at least 13 years old
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  address?: {
    street?: string; // Max 100 chars
    city?: string; // Max 50 chars
    state?: string; // Max 50 chars
    country?: string; // Max 50 chars
    postalCode?: string; // Max 10 chars
  };
}
```

#### 6.3 Update Payment Details
- **Endpoint**: `PUT /users/payment-details`
- **Status**: ✅ Implemented
- **Description**: Update user payment information
- **Request Schema**:
```typescript
{
  upiId: string; // Valid UPI ID format, max 50 chars
}
```

### 7. File Upload Endpoints

#### 7.1 Get Upload URL
- **Endpoint**: `POST /files/upload-url`
- **Status**: ✅ Implemented
- **Description**: Get signed S3 URL for file upload
- **Request Schema**:
```typescript
{
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // In bytes
}
```
- **Response Schema**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    uploadUrl: string; // S3 signed URL
    fileKey: string; // S3 object key
    expiresAt: Date; // URL expiration
  };
}
```
- **Validation**: ✅ File type (JPEG, PNG, WebP), max size 10MB

#### 7.2 Confirm File Upload
- **Endpoint**: `POST /files/confirm-upload`
- **Status**: ✅ Implemented
- **Description**: Confirm successful file upload
- **Request Schema**:
```typescript
{
  fileKey: string;
  fileUrl: string; // Public S3 URL
}
```

#### 7.3 Validate Receipt
- **Endpoint**: `POST /files/validate-receipt`
- **Status**: ✅ Implemented
- **Description**: Validate uploaded receipt file
- **Request Schema**:
```typescript
{
  fileKey: string;
}
```

### 8. Notification Endpoints

#### 8.1 Get User Notifications
- **Endpoint**: `GET /notifications`
- **Status**: ✅ Implemented
- **Description**: Get user's notifications
- **Query Parameters**:
```typescript
{
  unreadOnly?: boolean;
  page?: number; // Default: 1
  limit?: number; // Default: 20
  type?: 'TRANSACTION_STATUS' | 'BALANCE_UPDATE' | 'SYSTEM' | 'PAYMENT_PROCESSED';
}
```

#### 8.2 Get Unread Count
- **Endpoint**: `GET /notifications/unread-count`
- **Status**: ✅ Implemented
- **Description**: Get count of unread notifications

#### 8.3 Mark Notification as Read
- **Endpoint**: `PUT /notifications/:id/read`
- **Status**: ✅ Implemented
- **Description**: Mark specific notification as read

#### 8.4 Mark All Notifications as Read
- **Endpoint**: `PUT /notifications/read-all`
- **Status**: ✅ Implemented
- **Description**: Mark all notifications as read

#### 8.5 Delete Notification
- **Endpoint**: `PUT /notifications/:id/delete`
- **Status**: ✅ Implemented
- **Description**: Delete specific notification

### 9. Health Check Endpoints

#### 9.1 Health Check
- **Endpoint**: `GET /health`
- **Status**: ✅ Implemented
- **Description**: Basic health check with system status
- **Response Schema**:
```typescript
{
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}
```

#### 9.2 Detailed Health Check
- **Endpoint**: `GET /health/detailed`
- **Status**: ✅ Implemented
- **Description**: Detailed health check with all service statuses

## Error Responses

All endpoints return consistent error responses:

```typescript
{
  success: false;
  error: {
    code: string; // Error code
    message: string; // Human-readable message
    details?: any; // Additional error details
  };
  timestamp: string; // ISO timestamp
}
```

### Common Error Codes

- `AUTHENTICATION_FAILED`: Invalid or expired token
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `BUSINESS_RULE_VIOLATION`: Business logic validation failed
- `INSUFFICIENT_BALANCE`: User doesn't have enough coins
- `BRAND_CAP_EXCEEDED`: Brand earning/redemption cap reached
- `PENDING_REQUESTS_EXIST`: Cannot proceed while requests are pending
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File size exceeds limit
- `SYSTEM_MAINTENANCE`: System is in maintenance mode

## Rate Limiting

- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin
- **File upload endpoints**: 10 requests per minute per user

## WebSocket Events

### Real-time Updates

- `balance_updated`: User's coin balance changed
- `transaction_status_changed`: Transaction status updated
- `notification_received`: New notification received
- `admin_request_pending`: New pending request for admins

### WebSocket Message Format

```typescript
{
  event: string; // Event type
  data: any; // Event data
  timestamp: string; // ISO timestamp
  userId?: string; // For user-specific events
}
```

## Business Rules

### Earning Rules
1. ✅ Coins are immediately added to user balance upon earn request submission
2. ✅ Coins are reserved until admin approval/rejection
3. ✅ Brand earning caps are enforced per user and overall
4. ✅ Bill age and amount validation based on global config

### Redemption Rules
1. ✅ User must have sufficient coin balance
2. ❌ All pending earn requests must be processed first (not yet implemented)
3. ✅ Brand redemption caps are enforced per transaction and overall
4. ✅ Coins are reserved upon redemption request submission
5. ❌ Payment processing requires admin transaction ID (not yet implemented)

### Validation Rules
1. ✅ Bill amounts must meet minimum threshold
2. ✅ Bill dates cannot be in the future
3. ❌ Bill age must be within configured limit (not yet implemented)
4. ❌ Fraud prevention time gaps between submissions (not yet implemented)
5. ✅ File type and size restrictions

## Security Considerations

1. **JWT Token Expiry**: 24 hours for users, 8 hours for admins
2. **Password Policy**: Min 6 chars for users, complexity requirements for admins
3. **Rate Limiting**: Per-endpoint and per-user limits
4. **Input Validation**: All inputs validated with Zod schemas
5. **SQL Injection**: TypeORM parameterized queries
6. **File Upload**: Signed URLs, type validation, size limits
7. **Admin Access**: JWT authentication required
8. **Audit Logging**: Basic logging implemented

## Implementation Gaps

### High Priority (Required for MVP)
1. **✅ NEW AUTH FLOW COMPLETED**: Complete new authentication flow with progressive signup
2. **✅ MOBILE INTEGRATION COMPLETED**: Complete mobile app integration with new auth flow
3. **Transaction Approval/Rejection Workflow**: Complete the admin endpoints for approving/rejecting transactions
4. **Payment Processing**: Implement the payment processing system with transaction ID validation
5. **Balance Rollback**: Implement balance rollback for rejected earn requests
6. **Transaction Validation**: Complete the business rule validation for pending requests

### Medium Priority (Required for Production)
1. **Real-time Balance Updates**: Complete WebSocket integration for balance updates
2. **Advanced Validation**: Implement bill age validation and fraud prevention
3. **Admin Dashboard**: Complete admin transaction listing and filtering
4. **Error Handling**: Enhance error handling and user feedback

### Low Priority (Future Enhancements)
1. **OCR Integration**: Receipt processing and validation
2. **Advanced Analytics**: Transaction reporting and analytics
3. **Multi-language Support**: Internationalization
4. **Advanced Security**: Rate limiting per endpoint, IP blocking

## Next Steps

1. **✅ NEW AUTH FLOW**: Backend implementation complete, ready for mobile app integration
2. **Complete Transaction Workflow**: Implement the missing approval/rejection logic
3. **Add Payment Processing**: Complete the payment processing system
4. **Enhance Validation**: Add business rule validation for pending requests
5. **Real-time Features**: Complete WebSocket integration for balance updates
6. **Testing**: Add comprehensive testing for all endpoints
7. **Documentation**: Update mobile and admin documentation to match API changes