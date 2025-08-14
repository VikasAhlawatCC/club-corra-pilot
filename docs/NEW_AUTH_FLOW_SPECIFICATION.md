# Club Corra - New Authentication Flow Specification

## Overview

This document outlines the new authentication flow for Club Corra, which provides a more user-friendly and secure signup process. The new flow separates the signup process into distinct steps, allowing users to complete their account setup progressively.

## Flow Overview

```
1. Initial Signup (Name + Number) → 2. OTP Verification → 3. Password Setup → 4. Optional Email Verification → 5. Main App
```

## Detailed Flow Steps

### 1. Initial Signup (Create Your Account)
**Purpose**: Collect basic user information and create account in PENDING status

**Endpoint**: `POST /auth/signup/initial`

**Request Schema**:
```typescript
{
  firstName: string; // Required, 2-50 characters
  lastName: string;  // Required, 2-50 characters
  mobileNumber: string; // Required, valid Indian mobile number
}
```

**Response Schema**:
```typescript
{
  message: string;
  mobileNumber: string;
  requiresOtpVerification: boolean;
  existingUserMessage?: string; // Only if user already exists
  redirectToLogin?: boolean;    // Only if user already exists
}
```

**Business Logic**:
- ✅ Creates user account with PENDING status
- ✅ Sends SMS OTP for mobile verification
- ✅ Handles existing users:
  - If user exists and is ACTIVE → redirect to login
  - If user exists but PENDING without password → regenerate OTP
  - If user doesn't exist → create new account

**User State After**: `PENDING` status, mobile not verified, no password

---

### 2. OTP Verification
**Purpose**: Verify mobile number and prepare for password setup

**Endpoint**: `POST /auth/signup/verify-otp`

**Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  otpCode: string;      // Required, 4-6 digits
}
```

**Response Schema**:
```typescript
{
  message: string;
  userId: string;
  requiresPasswordSetup: boolean;
}
```

**Business Logic**:
- ✅ Verifies SMS OTP code
- ✅ Marks mobile number as verified
- ✅ Prepares user for password setup

**User State After**: `PENDING` status, mobile verified, no password

---

### 3. Password Setup
**Purpose**: Set user password and optionally activate account

**Endpoint**: `POST /auth/signup/setup-password`

**Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  password: string;     // Required, min 8 chars, must contain lowercase, uppercase, number
  confirmPassword: string; // Required, must match password
}
```

**Response Schema**:
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

**Business Logic**:
- ✅ Validates password strength requirements
- ✅ Sets user password
- ✅ Account activation logic:
  - If no email provided → activate immediately and return tokens
  - If email provided → requires email verification

**User State After**: 
- If no email: `ACTIVE` status, mobile verified, password set, tokens generated
- If email: `PENDING` status, mobile verified, password set, email not verified

---

### 4. Optional Email Verification
**Purpose**: Add email to account and verify it (optional step)

**Endpoint**: `POST /auth/signup/add-email`

**Request Schema**:
```typescript
{
  mobileNumber: string; // Required, valid Indian mobile number
  email: string;        // Required, valid email format
}
```

**Response Schema**:
```typescript
{
  message: string;
  userId: string;
  requiresEmailVerification: boolean;
}
```

**Business Logic**:
- ✅ Adds email to user account
- ✅ Sends email verification OTP
- ✅ Prevents duplicate email usage

**User State After**: `PENDING` status, mobile verified, password set, email added but not verified

---

### 5. Email Verification (Final Step)
**Purpose**: Verify email and activate account

**Endpoint**: `POST /auth/signup/verify-email`

**Request Schema**:
```typescript
{
  token: string; // Required, email verification token
}
```

**Response Schema**:
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

**Business Logic**:
- ✅ Verifies email verification token
- ✅ Marks email as verified
- ✅ Activates user account
- ✅ Generates and returns authentication tokens

**User State After**: `ACTIVE` status, mobile verified, password set, email verified, tokens generated

---

## Login Flow (Existing Users)

### Mobile OTP Login
**Endpoint**: `POST /auth/login/mobile`

**Flow**: Mobile number + OTP → Main app (if account is ACTIVE)

### Email Password Login
**Endpoint**: `POST /auth/login/email`

**Flow**: Email + Password → Main app (if account is ACTIVE and password set)

### OAuth Login
**Endpoint**: `POST /auth/login/oauth`

**Flow**: OAuth provider + token → Main app (if account is ACTIVE)

---

## User Status Management

### Status Transitions
```
NON_EXISTENT → PENDING (Initial signup)
PENDING → PENDING (OTP verification - no status change)
PENDING → PENDING (Password setup - no status change)
PENDING → ACTIVE (Password setup with no email OR Email verification)
```

### Status Requirements
- **PENDING**: Basic account created, mobile verified, password may or may not be set
- **ACTIVE**: Mobile verified, password set, ready for full app access

---

## Error Handling

### Common Error Scenarios

1. **User Already Exists (Active)**
   ```typescript
   {
     message: 'User already registered',
     redirectToLogin: true,
     existingUserMessage: 'This mobile number is already registered. Please login instead.'
   }
   ```

2. **Incomplete Account Found**
   ```typescript
   {
     message: 'Account found but incomplete. New OTP sent for verification.',
     requiresOtpVerification: true
   }
   ```

3. **Invalid User State**
   ```typescript
   {
     error: 'Invalid user state for [operation]'
   }
   ```

4. **OTP Verification Failed**
   ```typescript
   {
     error: 'Invalid OTP'
   }
   ```

---

## Security Features

### Password Requirements
- Minimum 8 characters
- Must contain lowercase letter
- Must contain uppercase letter
- Must contain number
- Confirmation must match

### OTP Security
- 4-6 digit codes
- 5-minute expiration
- Rate limiting on generation
- Maximum 3 attempts

### Account Protection
- Users cannot access app until ACTIVE status
- Password required for account activation
- Mobile verification mandatory
- Email verification optional but recommended

---

## Integration Points

### Backend Services
- **AuthService**: Main flow orchestration
- **UsersService**: User creation and management
- **OtpService**: OTP generation and verification
- **SmsService**: SMS delivery
- **EmailService**: Email delivery
- **JwtTokenService**: Token generation

### Database Entities
- **User**: Core user information and status
- **UserProfile**: Name and personal details
- **PaymentDetails**: Payment information
- **AuthProvider**: OAuth provider details
- **OTP**: One-time password storage

### Mobile App Integration
- **AuthProvider**: Context for auth state management
- **Navigation**: Flow-based screen routing
- **Storage**: Secure token storage
- **API Client**: HTTP requests to backend

---

## Testing Scenarios

### Happy Path
1. New user completes full flow
2. User skips email verification
3. Existing user completes incomplete account

### Edge Cases
1. User exists and is active
2. User exists but incomplete
3. Invalid OTP attempts
4. Password strength validation
5. Email already in use

### Error Scenarios
1. Network failures
2. Invalid input data
3. Server errors
4. Rate limiting

---

## Implementation Status

### ✅ Completed
- Backend service methods
- DTOs and validation
- Controller endpoints
- Database methods
- Error handling

### 🔄 In Progress
- Mobile app flow screens
- Integration testing
- Documentation updates

### ❌ Pending
- End-to-end testing
- Performance optimization
- Security audit
- Production deployment

---

## Next Steps

1. **Complete Mobile App Integration**
   - Update auth screens
   - Implement flow navigation
   - Add error handling

2. **Testing & Validation**
   - Unit tests for new methods
   - Integration tests for flow
   - End-to-end user testing

3. **Production Readiness**
   - Security review
   - Performance testing
   - Monitoring setup

4. **Documentation Updates**
   - API documentation
   - Mobile app guides
   - Admin documentation

---

## Migration Notes

### Existing Users
- Current users remain unaffected
- New flow only applies to new signups
- Existing users can continue using current login methods

### Database Changes
- No new tables required
- Existing user status field used
- New methods added to existing services

### API Compatibility
- New endpoints added
- Existing endpoints unchanged
- Backward compatibility maintained
