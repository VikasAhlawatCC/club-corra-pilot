# Database Schema with Primary Key (PK) and Foreign Key (FK) Tags

This document provides a comprehensive overview of the Club Corra database schema with all Primary Keys (PK) and Foreign Keys (FK) clearly marked.

## Database Tables Overview

### 1. Users Table
**Purpose**: Core user accounts with authentication details including password management and email verification

```sql
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "mobileNumber" character varying NOT NULL,               -- Unique
  "email" character varying,                               -- Unique
  "status" user_status_enum NOT NULL DEFAULT 'pending',
  "isMobileVerified" boolean NOT NULL DEFAULT false,
  "isEmailVerified" boolean NOT NULL DEFAULT false,
  "passwordHash" character varying,
  "refreshTokenHash" character varying,
  "emailVerificationToken" character varying,
  "emailVerificationExpiresAt" TIMESTAMP,
  "passwordResetToken" character varying,
  "passwordResetExpiresAt" TIMESTAMP,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_users" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_users_mobileNumber" UNIQUE ("mobileNumber"),
  CONSTRAINT "UQ_users_email" UNIQUE ("email")
);
```

**Indexes**:
- `IDX_users_mobileNumber` on `("mobileNumber")`
- `IDX_users_email` on `("email")`

---

### 2. User Profiles Table
**Purpose**: Extended user profile information

```sql
CREATE TABLE "user_profiles" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "firstName" character varying NOT NULL,
  "lastName" character varying NOT NULL,
  "dateOfBirth" date,
  "gender" character varying,
  "profilePicture" character varying,
  "address" character varying,
  "city" character varying,
  "state" character varying,
  "country" character varying,
  "postalCode" character varying,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" uuid NOT NULL,                                  -- FK - References users(id)
  CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
);
```

**Foreign Keys**:
- `FK_user_profiles_userId` → `users(id)` (CASCADE DELETE)

---

### 3. Payment Details Table
**Purpose**: User payment method preferences

```sql
CREATE TABLE "payment_details" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "upiId" character varying,
  "mobileNumber" character varying(15),
  "preferredMethod" payment_method_enum,
  "cardLastFour" character varying,
  "cardBrand" character varying,
  "walletType" character varying,
  "isDefault" boolean NOT NULL DEFAULT false,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" uuid NOT NULL,                                  -- FK - References users(id)
  CONSTRAINT "PK_payment_details" PRIMARY KEY ("id")
);
```

**Foreign Keys**:
- `FK_payment_details_userId` → `users(id)` (CASCADE DELETE)

---

### 4. Auth Providers Table
**Purpose**: OAuth provider connections for users

```sql
CREATE TABLE "auth_providers" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "provider" provider_type_enum NOT NULL,
  "providerUserId" character varying NOT NULL,             -- Unique
  "accessToken" character varying,
  "refreshToken" character varying,
  "tokenExpiresAt" TIMESTAMP,
  "providerData" jsonb,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" uuid NOT NULL,                                  -- FK - References users(id)
  CONSTRAINT "PK_auth_providers" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_auth_providers_providerUserId" UNIQUE ("providerUserId")
);
```

**Foreign Keys**:
- `FK_auth_providers_userId` → `users(id)` (CASCADE DELETE)

**Indexes**:
- `IDX_auth_providers_provider` on `("provider")`

---

### 5. OTPs Table
**Purpose**: One-time password verification records

```sql
CREATE TABLE "otps" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "identifier" character varying NOT NULL,
  "type" otp_type_enum NOT NULL,
  "code" character varying NOT NULL,
  "status" otp_status_enum NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "verifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_otps" PRIMARY KEY ("id")
);
```

**Indexes**:
- `IDX_otps_identifier_type_status` on `("identifier", "type", "status")`

---

### 6. Brand Categories Table
**Purpose**: Brand classification categories

```sql
CREATE TABLE "brand_categories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "name" character varying(100) NOT NULL,                  -- Unique
  "description" text,
  "icon" character varying(100),
  "color" character varying(7),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_brand_categories" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_brand_categories_name" UNIQUE ("name")
);
```

---

### 7. Brands Table
**Purpose**: Partner brands with earning/redemption rules

```sql
CREATE TABLE "brands" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "name" character varying(100) NOT NULL,
  "description" text NOT NULL,
  "logoUrl" character varying(500),
  "categoryId" uuid NOT NULL,                              -- FK - References brand_categories(id)
  "earningPercentage" decimal(5,2) DEFAULT 30,
  "redemptionPercentage" decimal(5,2) DEFAULT 100,
  "minRedemptionAmount" decimal(10,2) DEFAULT 1,
  "maxRedemptionAmount" decimal(10,2) DEFAULT 2000,
  "brandwiseMaxCap" decimal(10,2) DEFAULT 2000,
  "isActive" boolean DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_brands" PRIMARY KEY ("id")
);
```

**Foreign Keys**:
- `FK_brands_categoryId` → `brand_categories(id)` (RESTRICT DELETE, CASCADE UPDATE)

**Indexes**:
- `IDX_BRANDS_CATEGORY_ID` on `("categoryId")`
- `IDX_BRANDS_IS_ACTIVE` on `("isActive")`
- `IDX_BRANDS_CATEGORY_ACTIVE` on `("categoryId", "isActive")`
- `IDX_BRANDS_ACTIVE` on `("isActive")`
- `IDX_BRANDS_BRANDWISE_MAX_CAP` on `("brandwiseMaxCap")`

---

### 8. Coin Balances Table
**Purpose**: Current coin balance per user

```sql
CREATE TABLE "coin_balances" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "userId" uuid NOT NULL,                                  -- FK - References users(id), Unique
  "balance" decimal(10,2) DEFAULT 0,
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_coin_balances" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_coin_balances_userId" UNIQUE ("userId")
);
```

**Foreign Keys**:
- `FK_coin_balances_userId` → `users(id)` (CASCADE DELETE, CASCADE UPDATE)

**Indexes**:
- `IDX_coin_balance_user` on `("userId")`
- `IDX_COIN_BALANCES_LAST_UPDATED` on `("lastUpdated")`

---

### 9. Coin Transactions Table
**Purpose**: All coin earning and redemption transactions

```sql
CREATE TABLE "coin_transactions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "userId" uuid NOT NULL,                                  -- FK - References users(id)
  "amount" decimal(10,2) NOT NULL,
  "type" enum('WELCOME_BONUS', 'EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTMENT') NOT NULL,
  "brandId" uuid,                                          -- FK - References brands(id)
  "description" text NOT NULL,
  "referenceId" character varying(100),
  "transactionId" character varying(100),
  "billDate" date,
  "paymentProcessedAt" timestamp,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_coin_transactions" PRIMARY KEY ("id")
);
```

**Foreign Keys**:
- `FK_coin_transactions_userId` → `users(id)` (CASCADE DELETE, CASCADE UPDATE)
- `FK_coin_transactions_brandId` → `brands(id)` (SET NULL DELETE, CASCADE UPDATE)

**Indexes**:
- `IDX_COIN_TRANSACTIONS_USER_ID` on `("userId")`
- `IDX_COIN_TRANSACTIONS_TYPE` on `("type")`
- `IDX_COIN_TRANSACTIONS_BRAND_ID` on `("brandId")`
- `IDX_COIN_TRANSACTIONS_CREATED_AT` on `("createdAt")`
- `IDX_coin_transactions_user_type` on `("userId", "type")`
- `IDX_coin_transactions_user_created` on `("userId", "createdAt" DESC)`
- `IDX_coin_transactions_brand` on `("brandId")`
- `IDX_COIN_TRANSACTIONS_TRANSACTION_ID` on `("transactionId")`
- `IDX_COIN_TRANSACTIONS_BILL_DATE` on `("billDate")`
- `IDX_COIN_TRANSACTIONS_PAYMENT_PROCESSED` on `("paymentProcessedAt")`

**Unique Constraints**:
- `UQ_coin_transactions_user_welcome_bonus` on `("userId", "type")` WHERE `"type" = 'WELCOME_BONUS'`

---

### 10. Global Config Table
**Purpose**: System-wide configuration settings

```sql
CREATE TABLE "global_config" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),           -- PK - Primary Key
  "key" character varying(100) NOT NULL,                   -- Unique
  "value" text NOT NULL,
  "description" character varying(200),
  "type" character varying(50) DEFAULT 'string',
  "isEditable" boolean DEFAULT false,
  "category" character varying(100),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PK_global_config" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_global_config_key" UNIQUE ("key")
);
```

**Indexes**:
- `IDX_GLOBAL_CONFIG_KEY` on `("key")`
- `IDX_GLOBAL_CONFIG_CATEGORY` on `("category")`

---

## Database Relationships Summary

### One-to-One Relationships
- **Users** ↔ **User Profiles** (via `userId`)
- **Users** ↔ **Payment Details** (via `userId`)
- **Users** ↔ **Coin Balances** (via `userId`)

### One-to-Many Relationships
- **Users** → **Auth Providers** (via `userId`)
- **Users** → **Coin Transactions** (via `userId`)
- **Brand Categories** → **Brands** (via `categoryId`)
- **Brands** → **Coin Transactions** (via `brandId`)

### Many-to-Many Relationships
- **Users** ↔ **Brands** (via **Coin Transactions**)

## Enum Types

### User Status Enum
```sql
CREATE TYPE "public"."user_status_enum" AS ENUM('pending', 'active', 'suspended', 'deleted')
```

### OTP Type Enum
```sql
CREATE TYPE "public"."otp_type_enum" AS ENUM('sms', 'email')
```

### OTP Status Enum
```sql
CREATE TYPE "public"."otp_status_enum" AS ENUM('pending', 'verified', 'expired')
```

### Payment Method Enum
```sql
CREATE TYPE "public"."payment_method_enum" AS ENUM('upi', 'card', 'net_banking', 'wallet')
```

### Provider Type Enum
```sql
CREATE TYPE "public"."provider_type_enum" AS ENUM('google', 'facebook', 'apple')
```

### Transaction Type Enum
```sql
ENUM('WELCOME_BONUS', 'EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTMENT')
```

## Migration Files

The database schema is managed through the following migration files:

1. `1700000000000-CreateInitialTables.ts` - Creates users, user_profiles, payment_details, auth_providers, and otps tables
2. `1700000000001-AddBrandsAndCoins.ts` - Creates brand_categories, brands, coin_balances, and coin_transactions tables
3. `1700000000002-AddPerformanceIndexes.ts` - Adds performance optimization indexes
4. `1700000000003-AddWelcomeBonusConstraint.ts` - Adds unique constraint for welcome bonus
5. `1700000000004-AddBrandCapsAndPaymentTracking.ts` - Adds brand caps and payment tracking columns
6. `1700000000005-CreateGlobalConfigTable.ts` - Creates global configuration table
7. `1700000000006-AddPKAndFKTags.ts` - Adds PK and FK tags as comments
8. `1700000000007-UpdatePaymentDetailsAndBrandsSchema.ts` - Updates payment details and brands schema (adds mobile number, removes overallMaxCap, updates defaults)
9. `1700000000008-AddPasswordAndEmailVerification.ts` - Adds password and email verification columns to users table

## Running the Migration

To apply the PK and FK tags migration:

```bash
# From the API directory
cd apps/api

# Run the migration
npm run typeorm migration:run

# Or if using yarn
yarn typeorm migration:run
```

## Benefits of PK and FK Tags

1. **Clear Schema Documentation**: Developers can quickly identify primary and foreign keys
2. **Database Maintenance**: Easier to understand relationships when debugging or optimizing
3. **Team Collaboration**: New team members can quickly grasp the database structure
4. **Tooling Support**: Some database tools can use these comments for better visualization
5. **Audit Trail**: Clear documentation of intended relationships

## Notes

- All primary keys use UUID with `uuid_generate_v4()` as default
- Foreign keys use appropriate CASCADE/SET NULL/RESTRICT rules based on business logic
- Indexes are created for frequently queried columns and foreign keys
- The schema follows PostgreSQL best practices for performance and data integrity
