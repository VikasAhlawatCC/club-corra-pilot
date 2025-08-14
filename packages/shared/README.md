# @shared/shared Package

This package contains shared types, validation schemas, and utilities used across the Club Corra Pilot monorepo.

## What's Included

### 🔐 Authentication Types & Interfaces

- **User Management**: Complete user entity with profile, payment details, and authentication status
- **Auth Providers**: Support for SMS, Email, Google OAuth, and Facebook OAuth
- **OTP Verification**: Comprehensive OTP generation, validation, and expiry management
- **JWT Tokens**: Access and refresh token management with payload validation
- **Password Management**: Secure password setup, validation, and reset functionality
- **Email Verification**: Token-based email verification flow with expiry management
- **Security Events**: Tracking for login attempts, suspicious activity, and account changes

### �� Validation Schemas (Zod)

- **User Schemas**: Validation for user profiles, addresses, and payment methods
- **Authentication Schemas**: Request/response validation for all auth flows
- **Coin Schemas**: Transaction validation, balance management, and business rules
- **Brand Schemas**: Brand and category management with validation
- **Global Config Schemas**: System configuration and business rule validation

### ��️ Utility Functions

- **OTP Management**: Generation, hashing, verification, and expiry calculation
- **Input Validation**: Mobile number, email, and UPI ID format validation
- **Data Masking**: Privacy-friendly display of sensitive information
- **Token Management**: Session ID generation and expiry calculation
- **User Helpers**: Display name generation and status checking

## Installation

```bash
# From the root directory
yarn install

# Or from this package directory
cd packages/shared && yarn install
```

## Usage

### Importing Types

```typescript
import { 
  User, 
  UserProfile, 
  AuthProvider, 
  UserStatus,
  CoinTransaction,
  Brand,
  GlobalConfig
} from '@shared/shared';
```

### Using Validation Schemas

```typescript
import { 
  signupSchema, 
  requestOtpSchema,
  passwordSetupSchema,
  emailVerificationSchema,
  passwordResetSchema,
  createEarnTransactionSchema,
  createBrandSchema
} from '@shared/shared';

// Validate signup request
const validatedData = signupSchema.parse(signupData);

// Validate OTP request
const otpData = requestOtpSchema.parse(otpRequest);

// Validate coin transaction
const transactionData = createEarnTransactionSchema.parse(transactionRequest);

// Validate brand creation
const brandData = createBrandSchema.parse(brandRequest);

// Validate password setup
const passwordData = passwordSetupSchema.parse(passwordRequest);

// Validate email verification
const verificationData = emailVerificationSchema.parse(verificationRequest);

// Validate password reset
const resetData = passwordResetSchema.parse(resetRequest);
```

### Using Utility Functions

```typescript
import { 
  generateOTP, 
  validateMobileNumber, 
  maskEmail,
  calculateOTPExpiry,
  validateUPIId,
  generateSecureToken
} from '@shared/shared';

// Generate 6-digit OTP
const otp = generateOTP();

// Validate mobile number
const isValid = validateMobileNumber('+1234567890');

// Mask email for display
const maskedEmail = maskEmail('user@example.com');

// Calculate OTP expiry (5 minutes from now)
const expiry = calculateOTPExpiry();

// Validate UPI ID
const isValidUPI = validateUPIId('user@bank');

// Generate secure token
const token = generateSecureToken(32);
```

## Schema Categories

### Authentication Schemas (`auth.schema.ts`)

- **Base Validation**: Mobile numbers, emails, OTP codes
- **Request Schemas**: Signup, OAuth, OTP requests, login flows
- **Response Schemas**: Authentication responses, profile data
- **Password Management**: Secure password setup, validation, and reset schemas
- **Email Verification**: Token-based email verification with expiry management
- **Profile Management**: User profile updates, payment method updates

### User Schemas (`user.schema.ts`)

- **Base Validation**: Names, dates, gender, addresses
- **Profile Schemas**: User profiles, payment details, auth provider links
- **Validation Schemas**: OTP verification, JWT payloads, auth tokens

### Coin Schemas (`coin.schema.ts`)

- **Transaction Schemas**: Earning, redeeming, welcome bonus, adjustments
- **Balance Schemas**: Current balance, total earned/redeemed
- **Business Rules**: Transaction validation, payment processing
- **Admin Schemas**: Transaction management, status updates

### Brand Schemas (`brand.schema.ts`)

- **Brand Management**: Creation, updates, search and filtering
- **Category Schemas**: Brand categories with icons and colors
- **Business Rules**: Earning percentages, redemption limits, caps

### Global Config Schemas (`global-config.schema.ts`)

- **System Configuration**: Configurable business rules and settings
- **Category Management**: Organized configuration by business area
- **Validation**: Type-safe configuration values

## Type Definitions

### Core Interfaces

```typescript
interface User extends BaseEntity {
  mobileNumber: string;
  email?: string;
  status: UserStatus;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  hasWelcomeBonusProcessed?: boolean;
  profile?: UserProfile;
  paymentDetails?: PaymentDetails;
  authProviders: AuthProviderLink[];
}

interface CoinTransaction extends BaseEntity {
  userId: string;
  brandId?: string;
  type: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID';
  billAmount?: number;
  coinsEarned?: number;
  coinsRedeemed?: number;
}

interface Brand extends BaseEntity {
  name: string;
  description: string;
  categoryId: string;
  earningPercentage: number;
  redemptionPercentage: number;
  isActive: boolean;
}
```

### Enums

```typescript
enum AuthProvider {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK'
}

enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  WELCOME_BONUS = 'WELCOME_BONUS',
  ADJUSTMENT = 'ADJUSTMENT'
}
```

## Validation Examples

### Mobile Number Validation

```typescript
import { mobileNumberSchema } from '@shared/shared';

// Valid mobile numbers
mobileNumberSchema.parse('+1234567890');     // ✅
mobileNumberSchema.parse('1234567890');      // ✅
mobileNumberSchema.parse('+44123456789');   // ✅

// Invalid mobile numbers
mobileNumberSchema.parse('123');            // ❌ Too short
mobileNumberSchema.parse('abcdefghij');     // ❌ Non-numeric
mobileNumberSchema.parse('+12345678901234567890'); // ❌ Too long
```

### Coin Transaction Validation

```typescript
import { createEarnTransactionSchema } from '@shared/shared';

// Valid earn transaction
const validTransaction = createEarnTransactionSchema.parse({
  userId: 'uuid-here',
  brandId: 'brand-uuid',
  billAmount: 100.50,
  billDate: new Date(),
  receiptUrl: 'https://example.com/receipt.jpg'
});

// Invalid transaction
createEarnTransactionSchema.parse({
  userId: 'invalid-uuid',
  billAmount: -50,  // ❌ Negative amount
  billDate: new Date('2025-12-31')  // ❌ Future date
});
```

### Brand Creation Validation

```typescript
import { createBrandSchema } from '@shared/shared';

// Valid brand
const validBrand = createBrandSchema.parse({
  name: 'Starbucks',
  description: 'Coffee shop chain',
  categoryId: 'category-uuid',
  earningPercentage: 30,
  redemptionPercentage: 100
});

// Invalid brand
createBrandSchema.parse({
  name: '',  // ❌ Empty name
  earningPercentage: 150  // ❌ > 100%
});
```

## Security Features

### OTP Security

- 6-digit numeric OTPs
- 5-minute expiration window
- SHA-256 hashing with salt support
- Rate limiting support
- Attempt tracking and max attempts

### Input Sanitization

- Mobile number formatting and validation
- Email validation and masking
- Name sanitization (letters and spaces only)
- UPI ID format validation
- Secure token generation

### Privacy Protection

- Mobile number masking (last 4 digits visible)
- Email masking (first and last character visible)
- Secure token generation
- Session ID obfuscation

## Database Schema Reference

This section documents the actual database tables that correspond to the validation schemas defined in this package.

### Core User Tables

#### Users Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique user identifier |
| `mobileNumber` | `varchar` | `UNIQUE`, `NOT NULL` | User's mobile phone number |
| `email` | `varchar` | `UNIQUE`, `NULLABLE` | User's email address |
| `status` | `enum` | `DEFAULT 'pending'` | User account status: `pending`, `active`, `suspended`, `deleted` |
| `isMobileVerified` | `boolean` | `DEFAULT false` | Whether mobile number is verified |
| `isEmailVerified` | `boolean` | `DEFAULT false` | Whether email is verified |
| `hasWelcomeBonusProcessed` | `boolean` | `DEFAULT false` | Whether welcome bonus has been given |
| `passwordHash` | `varchar` | `NULLABLE` | Hashed password (for email login) |
| `refreshTokenHash` | `varchar` | `NULLABLE` | Hashed refresh token |
| `lastLoginAt` | `timestamp` | `NULLABLE` | Last login timestamp |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

#### User Profiles Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique profile identifier |
| `firstName` | `varchar` | `NOT NULL` | User's first name |
| `lastName` | `varchar` | `NOT NULL` | User's last name |
| `dateOfBirth` | `date` | `NULLABLE` | User's date of birth |
| `gender` | `varchar` | `NULLABLE` | Gender: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY` |
| `profilePicture` | `varchar` | `NULLABLE` | URL to profile picture |
| `street` | `varchar` | `NULLABLE` | Street address |
| `city` | `varchar` | `NULLABLE` | City name |
| `state` | `varchar` | `NULLABLE` | State/province name |
| `country` | `varchar` | `NULLABLE` | Country name |
| `postalCode` | `varchar` | `NULLABLE` | Postal/ZIP code |
| `userId` | `uuid` | `NOT NULL`, `FOREIGN KEY` | Reference to users table |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

#### Payment Details Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique payment detail identifier |
| `upiId` | `varchar` | `NULLABLE` | User's UPI ID for payments |
| `mobileNumber` | `varchar(15)` | `NULLABLE` | Mobile number associated with payment method |
| `preferredMethod` | `enum` | `NULLABLE` | Preferred payment method: `upi`, `card`, `net_banking`, `wallet` |
| `cardLastFour` | `varchar` | `NULLABLE` | Last 4 digits of card (if applicable) |
| `cardBrand` | `varchar` | `NULLABLE` | Card brand (Visa, MasterCard, etc.) |
| `walletType` | `varchar` | `NULLABLE` | Digital wallet type |
| `isDefault` | `boolean` | `DEFAULT false` | Whether this is the default payment method |
| `isActive` | `boolean` | `DEFAULT true` | Whether this payment method is active |
| `userId` | `uuid` | `NOT NULL`, `FOREIGN KEY` | Reference to users table |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

### Authentication Tables

#### OTPs Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique OTP identifier |
| `identifier` | `varchar` | `NOT NULL` | Mobile number or email for OTP |
| `type` | `enum` | `NOT NULL` | OTP type: `sms` or `email` |
| `code` | `varchar` | `NOT NULL` | The actual OTP code |
| `status` | `enum` | `DEFAULT 'pending'` | OTP status: `pending`, `verified`, `expired` |
| `expiresAt` | `timestamp` | `NOT NULL` | When OTP expires |
| `attempts` | `integer` | `DEFAULT 0` | Number of verification attempts |
| `verifiedAt` | `timestamp` | `NULLABLE` | When OTP was verified |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |

#### Auth Providers Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique provider link identifier |
| `provider` | `enum` | `NOT NULL` | OAuth provider: `google`, `facebook`, `apple` |
| `providerUserId` | `varchar` | `UNIQUE`, `NOT NULL` | User ID from the provider |
| `accessToken` | `varchar` | `NULLABLE` | OAuth access token |
| `refreshToken` | `varchar` | `NULLABLE` | OAuth refresh token |
| `tokenExpiresAt` | `timestamp` | `NULLABLE` | When access token expires |
| `providerData` | `jsonb` | `NULLABLE` | Additional provider-specific data |
| `isActive` | `boolean` | `DEFAULT true` | Whether this provider link is active |
| `userId` | `uuid` | `NOT NULL`, `FOREIGN KEY` | Reference to users table |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

### Brand Management Tables

#### Brand Categories Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique category identifier |
| `name` | `varchar(100)` | `UNIQUE`, `NOT NULL` | Category name |
| `description` | `text` | `NULLABLE` | Category description |
| `icon` | `varchar(100)` | `NULLABLE` | Icon identifier for UI |
| `color` | `varchar(7)` | `NULLABLE` | Hex color code (e.g., `#FF5733`) |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

#### Brands Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique brand identifier |
| `name` | `varchar(100)` | `NOT NULL` | Brand name |
| `description` | `text` | `NOT NULL` | Brand description |
| `logoUrl` | `varchar(500)` | `NULLABLE` | URL to brand logo |
| `categoryId` | `uuid` | `NOT NULL`, `FOREIGN KEY` | Reference to brand_categories table |
| `earningPercentage` | `decimal(5,2)` | `DEFAULT 30` | Percentage of bill amount earned as coins |
| `redemptionPercentage` | `decimal(5,2)` | `DEFAULT 100` | Percentage of bill that can be redeemed |
| `minRedemptionAmount` | `decimal(10,2)` | `DEFAULT 1` | Minimum amount required for redemption |
| `maxRedemptionAmount` | `decimal(10,2)` | `DEFAULT 2000` | Maximum amount that can be redeemed (same as brandwiseMaxCap) |
| `brandwiseMaxCap` | `decimal(10,2)` | `DEFAULT 2000` | Per-transaction maximum redemption limit (same as maxRedemptionAmount) |
| `isActive` | `boolean` | `DEFAULT true` | Whether brand is active |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

### Coin System Tables

#### Coin Balances Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique balance identifier |
| `userId` | `uuid` | `UNIQUE`, `NOT NULL`, `FOREIGN KEY` | Reference to users table |
| `balance` | `decimal(10,2)` | `DEFAULT 0` | Current coin balance |
| `totalEarned` | `decimal(10,2)` | `DEFAULT 0` | Total coins earned (lifetime) |
| `totalRedeemed` | `decimal(10,2)` | `DEFAULT 0` | Total coins redeemed (lifetime) |
| `lastUpdated` | `timestamp` | `DEFAULT now()` | Last balance update timestamp |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

#### Coin Transactions Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique transaction identifier |
| `userId` | `uuid` | `NOT NULL`, `FOREIGN KEY` | Reference to users table |
| `brandId` | `uuid` | `NULLABLE`, `FOREIGN KEY` | Reference to brands table |
| `type` | `enum` | `NOT NULL` | Transaction type: `EARN`, `REDEEM`, `WELCOME_BONUS`, `ADJUSTMENT` |
| `amount` | `decimal(10,2)` | `NOT NULL` | Transaction amount |
| `billAmount` | `decimal(10,2)` | `NULLABLE` | Original bill amount |
| `coinsEarned` | `decimal(10,2)` | `NULLABLE` | Coins earned in this transaction |
| `coinsRedeemed` | `decimal(10,2)` | `NULLABLE` | Coins redeemed in this transaction |
| `status` | `enum` | `NOT NULL` | Transaction status: `PENDING`, `APPROVED`, `REJECTED`, `PROCESSED`, `PAID` |
| `receiptUrl` | `varchar` | `NULLABLE` | URL to receipt/bill image |
| `adminNotes` | `text` | `NULLABLE` | Admin notes about the transaction |
| `processedAt` | `timestamp` | `NULLABLE` | When transaction was processed |
| `transactionId` | `varchar(100)` | `NULLABLE` | External transaction ID |
| `billDate` | `date` | `NULLABLE` | Date of the bill |
| `paymentProcessedAt` | `timestamp` | `NULLABLE` | When payment was processed |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

### System Configuration Tables

#### Global Config Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Unique config identifier |
| `key` | `varchar(100)` | `NOT NULL` | Configuration key |
| `value` | `varchar` | `NOT NULL` | Configuration value |
| `description` | `varchar(200)` | `NULLABLE` | Configuration description |
| `type` | `enum` | `NOT NULL` | Value type: `string`, `number`, `boolean`, `json` |
| `isEditable` | `boolean` | `DEFAULT false` | Whether config can be edited via admin |
| `category` | `varchar(100)` | `NULLABLE` | Configuration category |
| `createdAt` | `timestamp` | `DEFAULT now()` | Record creation timestamp |
| `updatedAt` | `timestamp` | `DEFAULT now()` | Last update timestamp |

### Key Relationships

- **Users** → **User Profiles** (1:1)
- **Users** → **Payment Details** (1:1)
- **Users** → **Auth Providers** (1:many)
- **Users** → **Coin Balance** (1:1)
- **Users** → **Coin Transactions** (1:many)
- **Brand Categories** → **Brands** (1:many)
- **Brands** → **Coin Transactions** (1:many)

### Indexes for Performance

- `IDX_users_mobileNumber` on `users(mobileNumber)`
- `IDX_users_email` on `users(email)`
- `IDX_otps_identifier_type_status` on `otps(identifier, type, status)`
- `IDX_brands_category_id` on `brands(categoryId)`
- `IDX_brands_is_active` on `brands(isActive)`
- `IDX_coin_transactions_user_id` on `coin_transactions(userId)`
- `IDX_coin_transactions_type` on `coin_transactions(type)`
- `IDX_coin_transactions_brand_id` on `coin_transactions(brandId)`
- `IDX_coin_transactions_created_at` on `coin_transactions(createdAt)`

### Schema Validation Mapping

The Zod schemas in this package validate the data that flows into and out of these database tables:

- **`auth.schema.ts`** → Validates authentication requests/responses
- **`user.schema.ts`** → Validates user profile and payment data
- **`coin.schema.ts`** → Validates coin transactions and balance operations
- **`brand.schema.ts`** → Validates brand and category management
- **`global-config.schema.ts`** → Validates system configuration values

Each schema ensures data integrity before it reaches the database and provides type safety across the entire application stack.

## Development

### Building

```bash
yarn build
```

### Type Checking

```bash
yarn typecheck
```

### Development Mode

```bash
yarn dev
```

## Dependencies

- **Zod**: Runtime validation schemas
- **TypeScript**: Type definitions and compilation
- **crypto-js**: Cryptographic functions for OTP hashing

## Contributing

When adding new types or schemas:

1. **Types**: Add to `src/types.ts`
2. **Schemas**: Add to appropriate schema file in `src/schemas/`
3. **Utilities**: Add to `src/utils.ts`
4. **Exports**: Update `src/index.ts` and `src/schemas/index.ts`
5. **Documentation**: Update this README

## Next Steps

This package is ready for Phase 2 implementation:

- **Backend API**: NestJS entities and services
- **Mobile App**: React Native components and state management
- **Admin Portal**: Next.js authentication and user management

## License

Private - Club Corra Pilot