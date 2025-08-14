# Backend API Endpoints Specification

## Overview

This document provides a comprehensive specification for all API endpoints that need to be implemented in the Club Corra backend. Each endpoint includes request/response schemas, validation rules, business logic, and implementation status.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.clubcorra.com`

## Authentication

All endpoints (except public ones) require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Implementation Status Legend

- 🔴 **Not Started**: Endpoint not yet implemented
- 🟡 **Partially Implemented**: Endpoint exists but functionality incomplete
- 🟢 **Completed**: Endpoint fully implemented and tested
- 🔵 **Blocked**: Endpoint blocked by dependencies

## 1. Authentication Endpoints

### 1.1 User Signup
- **Endpoint**: `POST /auth/signup`
- **Status**: 🟢 **Completed**
- **Description**: Create new user account with mobile number and OTP verification
- **Request Schema**:
```typescript
{
  mobileNumber: string; // 10-15 digits, optional + prefix
  email?: string; // Optional, for OAuth or email OTP
  authProvider: 'SMS' | 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
  profile?: {
    firstName?: string; // Max 100 chars, letters and spaces only
    lastName?: string; // Max 100 chars, letters and spaces only
    dateOfBirth?: Date; // User must be at least 13 years old
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  };
}
```
- **Response Schema**:
```typescript
{
  user: {
    id: string;
    mobileNumber: string;
    email?: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    isMobileVerified: boolean;
    isEmailVerified: boolean;
    hasWelcomeBonusProcessed?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
  };
}
```

### 1.2 Admin Signup
- **Endpoint**: `POST /auth/admin/signup`
- **Status**: 🔴 **Not Started**
- **Description**: Create admin account (restricted to @clubcorra.com domain)
- **Request Schema**:
```typescript
{
  email: string; // Must end with @clubcorra.com
  password: string; // Min 8 characters, complexity requirements
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}
```
- **Response Schema**:
```typescript
{
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    status: 'ACTIVE' | 'SUSPENDED';
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
  };
}
```

### 1.3 Request OTP
- **Endpoint**: `POST /auth/request-otp`
- **Status**: 🟢 **Completed**
- **Description**: Request OTP for mobile or email verification
- **Request Schema**:
```typescript
{
  mobileNumber?: string; // Required for SMS OTP
  email?: string; // Required for email OTP
  type: 'SMS' | 'EMAIL';
}
```

### 1.4 Verify OTP
- **Endpoint**: `POST /auth/verify-otp`
- **Status**: 🟢 **Completed**
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

### 1.5 Mobile Login
- **Endpoint**: `POST /auth/login/mobile`
- **Status**: 🟢 **Completed**
- **Description**: Authenticate user with mobile number and OTP
- **Request Schema**:
```typescript
{
  mobileNumber: string;
  otpCode: string; // 4-6 digits
}
```

### 1.6 Email Login
- **Endpoint**: `POST /auth/login/email`
- **Status**: 🟢 **Completed**
- **Description**: Authenticate user with email and password
- **Request Schema**:
```typescript
{
  email: string;
  password: string; // Min 6 characters
}
```

### 1.7 Admin Login
- **Endpoint**: `POST /auth/admin/login`
- **Status**: 🔴 **Not Started**
- **Description**: Authenticate admin user
- **Request Schema**:
```typescript
{
  email: string;
  password: string;
}
```

### 1.8 OAuth Login
- **Endpoint**: `POST /auth/login/oauth`
- **Status**: 🟢 **Completed**
- **Description**: Authenticate user via OAuth provider
- **Request Schema**:
```typescript
{
  provider: 'GOOGLE' | 'FACEBOOK';
  accessToken: string;
}
```

### 1.9 Refresh Token
- **Endpoint**: `POST /auth/refresh-token`
- **Status**: 🟢 **Completed**
- **Description**: Refresh expired access token
- **Request Schema**:
```typescript
{
  refreshToken: string;
}
```

### 1.10 Logout
- **Endpoint**: `POST /auth/logout`
- **Status**: 🟢 **Completed**
- **Description**: Logout user (token blacklisting not yet implemented)

## 2. User Management Endpoints

### 2.1 Get User Profile
- **Endpoint**: `GET /users/profile`
- **Status**: 🟢 **Completed**
- **Description**: Get current user's profile and information
- **Response Schema**:
```typescript
{
  id: string;
  mobileNumber: string;
  email?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    profilePicture?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
  paymentDetails?: {
    upiId?: string;
  };
}
```

### 2.2 Update User Profile
- **Endpoint**: `PUT /users/profile`
- **Status**: 🟢 **Completed**
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

### 2.3 Update Payment Details
- **Endpoint**: `PUT /users/payment-details`
- **Status**: 🟢 **Completed**
- **Description**: Update user payment information
- **Request Schema**:
```typescript
{
  upiId: string; // Valid UPI ID format, max 50 chars
}
```

### 2.4 Get User Balance
- **Endpoint**: `GET /users/balance`
- **Status**: 🟡 **Partially Implemented**
- **Description**: Get current coin balance and summary
- **Response Schema**:
```typescript
{
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  lastUpdated: Date;
  pendingEarnRequests: number;
  pendingRedeemRequests: number;
}
```

### 2.5 Get Balance History
- **Endpoint**: `GET /users/balance/history`
- **Status**: 🔴 **Not Started**
- **Description**: Get user's balance change history
- **Query Parameters**:
```typescript
{
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  type?: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'WELCOME_BONUS';
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}
```

### 2.6 Get User Analytics
- **Endpoint**: `GET /users/analytics`
- **Status**: 🔴 **Not Started**
- **Description**: Get user's transaction and engagement analytics
- **Query Parameters**:
```typescript
{
  timeRange: '7_DAYS' | '30_DAYS' | '90_DAYS' | '1_YEAR';
}
```

### 2.7 Admin: Get All Users
- **Endpoint**: `GET /users/admin/users`
- **Status**: 🔴 **Not Started**
- **Description**: Get all users with filtering (admin only)
- **Query Parameters**:
```typescript
{
  query?: string; // Search by name, mobile, email
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}
```

### 2.8 Admin: Update User Status
- **Endpoint**: `PUT /users/admin/users/:id/status`
- **Status**: 🔴 **Not Started**
- **Description**: Update user status (admin only)
- **Request Schema**:
```typescript
{
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  reason?: string; // Required for suspension/deletion
}
```

## 3. Coin Transaction Endpoints

### 3.1 Submit Earn Request
- **Endpoint**: `POST /coins/transactions/earn`
- **Status**: 🟡 **Partially Implemented**
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

### 3.2 Submit Redemption Request
- **Endpoint**: `POST /coins/transactions/redeem`
- **Status**: 🟡 **Partially Implemented**
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

### 3.3 Get Transaction History
- **Endpoint**: `GET /coins/transactions`
- **Status**: 🟢 **Completed**
- **Description**: Get user's transaction history with filtering
- **Query Parameters**:
```typescript
{
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
}
```

### 3.4 Get My Transactions
- **Endpoint**: `GET /coins/transactions/my`
- **Status**: 🟢 **Completed**
- **Description**: Get current user's transactions (alias for /coins/transactions)

### 3.5 Validate Earn Request
- **Endpoint**: `POST /coins/transactions/validate-earn`
- **Status**: 🔴 **Not Started**
- **Description**: Validate earn request before submission
- **Request Schema**:
```typescript
{
  brandId: string;
  billAmount: number;
  billDate: string;
}
```
- **Response Schema**:
```typescript
{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedCoins: number;
  brandCapInfo: {
    userEarningCap: number;
    overallEarningCap: number;
    remainingUserCap: number;
    remainingOverallCap: number;
  };
}
```

### 3.6 Validate Redeem Request
- **Endpoint**: `POST /coins/transactions/validate-redeem`
- **Status**: 🔴 **Not Started**
- **Description**: Validate redemption request before submission
- **Request Schema**:
```typescript
{
  brandId: string;
  coinsToRedeem: number;
}
```
- **Response Schema**:
```typescript
{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableBalance: number;
  pendingRequests: number;
  brandCapInfo: {
    userRedemptionCap: number;
    overallRedemptionCap: number;
    remainingUserCap: number;
    remainingOverallCap: number;
  };
}
```

## 4. Admin Transaction Management Endpoints

### 4.1 Create Welcome Bonus
- **Endpoint**: `POST /admin/coins/welcome-bonus`
- **Status**: 🟢 **Completed**
- **Description**: Admin creates welcome bonus for user
- **Request Schema**:
```typescript
{
  userId: string; // UUID
  mobileNumber: string; // Min 10 digits
}
```

### 4.2 Get User Balance (Admin)
- **Endpoint**: `GET /admin/coins/balance/:userId`
- **Status**: 🟢 **Completed**
- **Description**: Admin gets user's coin balance

### 4.3 Get User Transaction Summary (Admin)
- **Endpoint**: `GET /admin/coins/summary/:userId`
- **Status**: 🟢 **Completed**
- **Description**: Admin gets user's transaction summary and recent transactions

### 4.4 List All Transactions (Admin)
- **Endpoint**: `GET /admin/coins/transactions`
- **Status**: 🔴 **Not Started**
- **Description**: Get all transactions with admin filtering
- **Query Parameters**:
```typescript
{
  type?: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID';
  userId?: string;
  brandId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  sortBy?: 'createdAt' | 'updatedAt' | 'billAmount' | 'amount';
  sortOrder?: 'ASC' | 'DESC';
}
```

### 4.5 Get Pending Transactions (Admin)
- **Endpoint**: `GET /admin/coins/transactions/pending`
- **Status**: 🔴 **Not Started**
- **Description**: Get count and list of pending requests by type
- **Response Schema**:
```typescript
{
  pendingEarnRequests: number;
  pendingRedeemRequests: number;
  recentTransactions: Transaction[];
}
```

### 4.6 Approve Transaction (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/approve`
- **Status**: 🔴 **Not Started**
- **Description**: Approve earn/redemption request
- **Request Schema**:
```typescript
{
  adminNotes?: string; // Optional, max 1000 chars
}
```
- **Business Logic**:
  - For EARN requests: Mark as APPROVED, finalize coin distribution
  - For REDEEM requests: Mark as APPROVED, prepare for payment processing
  - Send notification to user
  - Broadcast real-time update

### 4.7 Reject Transaction (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/reject`
- **Status**: 🔴 **Not Started**
- **Description**: Reject request with notes
- **Request Schema**:
```typescript
{
  reason: string; // Required rejection reason, max 500 chars
  adminNotes?: string; // Optional, max 1000 chars
}
```
- **Business Logic**:
  - For EARN requests: Mark as REJECTED, rollback coins from balance
  - For REDEEM requests: Mark as REJECTED, return reserved coins
  - Send notification to user
  - Broadcast real-time update

### 4.8 Mark Payment as Complete (Admin)
- **Endpoint**: `PUT /admin/coins/transactions/:id/mark-paid`
- **Status**: 🔴 **Not Started**
- **Description**: Mark redemption as paid (manual payment completed)
- **Request Schema**:
```typescript
{
  adminNotes?: string; // Optional, max 1000 chars
}
```
- **Business Logic**:
  - Update transaction status to PAID
  - Record payment completion timestamp
  - Send payment completion notification to user
  - Broadcast real-time update
  - Update audit trail

### 4.9 Get Dashboard Stats (Admin)
- **Endpoint**: `GET /admin/coins/dashboard/stats`
- **Status**: 🔴 **Not Started**
- **Description**: Get admin dashboard statistics
- **Response Schema**:
```typescript
{
  totalUsers: number;
  totalTransactions: number;
  pendingEarnRequests: number;
  pendingRedeemRequests: number;
  totalCoinsInCirculation: number;
  totalCoinsRedeemed: number;
  todayStats: {
    newUsers: number;
    newTransactions: number;
    coinsEarned: number;
    coinsRedeemed: number;
  };
  weeklyStats: {
    newUsers: number;
    newTransactions: number;
    coinsEarned: number;
    coinsRedeemed: number;
  };
}
```

### 4.10 Get Recent Activity (Admin)
- **Endpoint**: `GET /admin/coins/dashboard/recent-activity`
- **Status**: 🔴 **Not Started**
- **Description**: Get recent admin dashboard activity
- **Query Parameters**:
```typescript
{
  limit?: number; // Default: 20, Max: 100
}
```

### 4.11 Get Brand Performance (Admin)
- **Endpoint**: `GET /admin/coins/dashboard/brand-performance`
- **Status**: 🔴 **Not Started**
- **Description**: Get brand performance analytics for admin dashboard
- **Query Parameters**:
```typescript
{
  timeRange: '7_DAYS' | '30_DAYS' | '90_DAYS' | '1_YEAR';
  limit?: number; // Default: 10, Max: 50
}
```

## 5. Brand Management Endpoints

### 5.1 Create Brand
- **Endpoint**: `POST /brands`
- **Status**: 🟢 **Completed**
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

### 5.2 Update Brand
- **Endpoint**: `PATCH /brands/:id`
- **Status**: 🟢 **Completed**
- **Description**: Update existing brand configuration

### 5.3 List Brands
- **Endpoint**: `GET /brands`
- **Status**: 🟢 **Completed**
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

### 5.4 Get Active Brands
- **Endpoint**: `GET /brands/active`
- **Status**: 🟢 **Completed**
- **Description**: Get all active brands

### 5.5 Get Brands by Category
- **Endpoint**: `GET /brands/category/:categoryId`
- **Status**: 🟢 **Completed**
- **Description**: Get brands filtered by category

### 5.6 Get Brand by ID
- **Endpoint**: `GET /brands/:id`
- **Status**: 🟢 **Completed**
- **Description**: Get specific brand details

### 5.7 Toggle Brand Status
- **Endpoint**: `PATCH /brands/:id/toggle-status`
- **Status**: 🟢 **Completed**
- **Description**: Activate/deactivate brand

### 5.8 Delete Brand
- **Endpoint**: `DELETE /brands/:id`
- **Status**: 🟢 **Completed**
- **Description**: Delete brand (cannot delete if has transactions)

### 5.9 Create Brand Category
- **Endpoint**: `POST /brands/categories`
- **Status**: 🔴 **Not Started**
- **Description**: Create new brand category
- **Request Schema**:
```typescript
{
  name: string; // Max 100 chars
  description?: string; // Max 500 chars
  icon?: string; // Max 100 chars
  color?: string; // Hex color code
}
```

### 5.10 Get Brand Categories
- **Endpoint**: `GET /brands/categories`
- **Status**: 🔴 **Not Started**
- **Description**: Get all brand categories

### 5.11 Get Brand Analytics
- **Endpoint**: `GET /brands/:id/analytics`
- **Status**: 🔴 **Not Started**
- **Description**: Get brand performance analytics
- **Query Parameters**:
```typescript
{
  timeRange: '7_DAYS' | '30_DAYS' | '90_DAYS' | '1_YEAR';
}
```

## 6. File Management Endpoints

### 6.1 Get Upload URL
- **Endpoint**: `POST /files/upload-url`
- **Status**: 🟢 **Completed**
- **Description**: Get signed S3 URL for file upload
- **Request Schema**:
```typescript
{
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // In bytes
}
```

### 6.2 Confirm File Upload
- **Endpoint**: `POST /files/confirm-upload`
- **Status**: 🟢 **Completed**
- **Description**: Confirm successful file upload
- **Request Schema**:
```typescript
{
  fileKey: string;
  fileUrl: string; // Public S3 URL
}
```

### 6.3 Validate Receipt
- **Endpoint**: `POST /files/validate-receipt`
- **Status**: 🟢 **Completed**
- **Description**: Validate uploaded receipt file
- **Request Schema**:
```typescript
{
  fileKey: string;
}
```

### 6.4 Process File
- **Endpoint**: `POST /files/process/:fileKey`
- **Status**: 🔴 **Not Started**
- **Description**: Process uploaded file (optimization, OCR, etc.)
- **Request Schema**:
```typescript
{
  processingType: 'OPTIMIZE' | 'OCR' | 'THUMBNAIL' | 'ALL';
}
```

### 6.5 Extract Receipt Data
- **Endpoint**: `POST /files/extract-receipt-data/:fileKey`
- **Status**: 🔴 **Not Started**
- **Description**: Extract data from receipt using OCR
- **Response Schema**:
```typescript
{
  extractedData: {
    merchantName?: string;
    totalAmount?: number;
    date?: string;
    items?: ReceiptItem[];
    confidence: number;
  };
  processingTime: number;
}
```

## 7. Notification Endpoints

### 7.1 Get User Notifications
- **Endpoint**: `GET /notifications`
- **Status**: 🟢 **Completed**
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

### 7.2 Get Unread Count
- **Endpoint**: `GET /notifications/unread-count`
- **Status**: 🟢 **Completed**
- **Description**: Get count of unread notifications

### 7.3 Mark Notification as Read
- **Endpoint**: `PUT /notifications/:id/read`
- **Status**: 🟢 **Completed**
- **Description**: Mark specific notification as read

### 7.4 Mark All Notifications as Read
- **Endpoint**: `PUT /notifications/read-all`
- **Status**: 🟢 **Completed**
- **Description**: Mark all notifications as read

### 7.5 Delete Notification
- **Endpoint**: `PUT /notifications/:id/delete`
- **Status**: 🟢 **Completed**
- **Description**: Delete specific notification

### 7.6 Send Push Notification (Admin)
- **Endpoint**: `POST /notifications/send-push/:userId`
- **Status**: 🔴 **Not Started**
- **Description**: Send push notification to specific user (admin only)
- **Request Schema**:
```typescript
{
  title: string; // Max 100 chars
  message: string; // Max 500 chars
  data?: Record<string, any>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}
```

### 7.7 Send Email Notification (Admin)
- **Endpoint**: `POST /notifications/send-email/:userId`
- **Status**: 🔴 **Not Started**
- **Description**: Send email notification to specific user (admin only)
- **Request Schema**:
```typescript
{
  subject: string; // Max 200 chars
  message: string; // Max 2000 chars
  template?: string; // Email template name
  data?: Record<string, any>;
}
```

## 8. WebSocket Events

### 8.1 Join User Room
- **Event**: `join_user_room`
- **Status**: 🔴 **Not Started**
- **Description**: User joins their personal room for real-time updates
- **Payload**:
```typescript
{
  userId: string;
}
```

### 8.2 Join Admin Room
- **Event**: `admin_room`
- **Status**: 🔴 **Not Started**
- **Description**: Admin joins admin room for real-time updates
- **Payload**:
```typescript
{
  adminId: string;
}
```

### 8.3 Balance Update
- **Event**: `balance_update`
- **Status**: 🔴 **Not Started**
- **Description**: Broadcast balance update to user
- **Payload**:
```typescript
{
  userId: string;
  oldBalance: number;
  newBalance: number;
  changeType: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'WELCOME_BONUS';
  transactionId: string;
}
```

### 8.4 Transaction Status Update
- **Event**: `transaction_status_update`
- **Status**: 🔴 **Not Started**
- **Description**: Broadcast transaction status change to user
- **Payload**:
```typescript
{
  userId: string;
  transactionId: string;
  oldStatus: TransactionStatus;
  newStatus: TransactionStatus;
  adminNotes?: string;
  timestamp: string;
}
```

### 8.5 Admin Notification
- **Event**: `admin_notification`
- **Status**: 🔴 **Not Started**
- **Description**: Send notification to admin room
- **Payload**:
```typescript
{
  type: 'PENDING_REQUEST' | 'SYSTEM_ALERT' | 'FRAUD_DETECTION';
  message: string;
  data?: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  timestamp: string;
}
```

## 9. Global Configuration Endpoints

### 9.1 Get All Configurations
- **Endpoint**: `GET /config`
- **Status**: 🟢 **Completed**
- **Description**: Get all global configuration values

### 9.2 Get Configurations by Category
- **Endpoint**: `GET /config/category/:category`
- **Status**: 🟢 **Completed**
- **Description**: Get configurations filtered by category
- **Categories**: 'brand', 'user', 'transaction', 'security', 'system', 'file'

### 9.3 Update Configuration
- **Endpoint**: `PUT /config/:key`
- **Status**: 🟢 **Completed**
- **Description**: Update specific configuration value
- **Request Schema**:
```typescript
{
  value: string | number | boolean | object;
}
```

### 9.4 Initialize Default Configs
- **Endpoint**: `GET /config/initialize-defaults`
- **Status**: 🟢 **Completed**
- **Description**: Initialize default configuration values

### 9.5 Clear Config Cache
- **Endpoint**: `GET /config/cache/clear`
- **Status**: 🟢 **Completed**
- **Description**: Clear configuration cache

## 10. Health Check Endpoints

### 10.1 Health Check
- **Endpoint**: `GET /health`
- **Status**: 🟢 **Completed**
- **Description**: Basic health check with system status

### 10.2 Detailed Health Check
- **Endpoint**: `GET /health/detailed`
- **Status**: 🟢 **Completed**
- **Description**: Detailed health check with all service statuses

## Business Logic Implementation

### Transaction Workflow

#### Earn Request Workflow
1. **Validation**: Check brand exists, user eligibility, bill validation
2. **Business Rules**: Validate brand caps, fraud prevention, bill age
3. **Processing**: Calculate coins, create transaction, update balance
4. **Notification**: Send real-time update, create notification
5. **Admin Alert**: Notify admins of pending request

#### Redemption Request Workflow
1. **Validation**: Check balance, brand limits, pending requests
2. **Business Rules**: Validate redemption caps, user eligibility
3. **Processing**: Reserve coins, create transaction
4. **Notification**: Send real-time update, create notification
5. **Admin Alert**: Notify admins of pending request

#### Approval/Rejection Workflow
1. **Admin Action**: Approve or reject with notes
2. **Status Update**: Update transaction status
3. **Balance Management**: Finalize or rollback coins
4. **Notification**: Send status update to user
5. **Real-time Update**: Broadcast changes via WebSocket

#### Payment Processing Workflow
1. **Admin Action**: Admin clicks "Mark as Paid" button
2. **Status Update**: Update transaction status to PAID
3. **Timestamp**: Record payment completion timestamp
4. **Notification**: Send payment completion notification to user
5. **Real-time Update**: Broadcast status change via WebSocket
6. **Audit Trail**: Update payment audit trail

### Business Rules Engine

#### Brand Cap Validation
- **User Earning Cap**: Maximum coins user can earn from specific brand
- **Overall Earning Cap**: Maximum coins all users can earn from brand
- **User Redemption Cap**: Maximum coins user can redeem from brand
- **Overall Redemption Cap**: Maximum coins all users can redeem from brand

#### Fraud Prevention
- **Bill Age**: Maximum age of bills (default: 30 days)
- **Time Gap**: Minimum time between submissions (default: 24 hours)
- **Duplicate Detection**: Prevent duplicate bill submissions
- **Pattern Analysis**: Detect suspicious transaction patterns

#### User Eligibility
- **Account Status**: User account must be active
- **Verification**: Mobile/email verification required
- **Pending Requests**: All pending requests must be processed
- **Balance Sufficiency**: Sufficient balance for redemption

## Error Handling

### Error Response Format
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

### Endpoint Rate Limits
- **Public endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1000 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin
- **File upload endpoints**: 10 requests per minute per user
- **WebSocket connections**: 5 connections per user, 20 per admin

## Success Criteria

### Functional Requirements
- [ ] All transaction workflows complete and functional
- [ ] Admin approval/rejection system working
- [ ] Manual payment completion system operational
- [ ] Real-time updates functioning
- [ ] File upload and processing working
- [ ] Notification system operational

### Performance Requirements
- [ ] API response time < 200ms
- [ ] Database query time < 100ms
- [ ] WebSocket message delivery < 500ms
- [ ] Support for 10,000+ concurrent users
- [ ] 99.9% uptime

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Comprehensive error handling
- [ ] Complete API documentation
- [ ] Performance monitoring in place

## Conclusion

This specification provides a comprehensive guide for implementing all required API endpoints in the Club Corra backend. Each endpoint is clearly defined with request/response schemas, business logic, and implementation status. Following this specification will ensure a complete, production-ready API that meets all business requirements and technical standards.

The implementation should be approached systematically, starting with core business logic and progressing to advanced features. Regular testing and validation against this specification will help ensure no functionality is missed and all requirements are met.
