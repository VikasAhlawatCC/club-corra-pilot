# Club Corra Pilot - Comprehensive Design Document

## 🎯 Executive Summary

Club Corra is a mobile loyalty and rewards application built as a monorepo using Yarn Workspaces + Turborepo. The system enables users to earn and redeem "Corra Coins" through brand partnerships using a bill-upload verification model. The architecture consists of three main applications: mobile app (Expo), admin portal (Next.js), and backend API (NestJS), all sharing common types and utilities.

## 🏗️ High-Level Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Admin Portal   │    │   Backend API   │
│   (Expo RN)     │◄──►│   (Next.js)     │◄──►│   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shared Types  │    │   PostgreSQL    │    │   S3 Storage    │
│   & Utilities   │    │   (Neon)        │    │   + CloudFront  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Monorepo**: Yarn Workspaces + Turborepo
- **Mobile**: React Native (Expo) + NativeWind
- **Admin**: Next.js + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Infrastructure**: AWS (EC2/App Runner/ECS) + Vercel + Neon
- **Package Manager**: Yarn Berry (node_modules linker)

## 🔄 Workflow & User Journey

### 1. User Registration & Onboarding
```
Mobile App → OTP Verification → Profile Setup → UPI Details → Welcome Bonus (100 Coins)
```

### 2. Earning Coins Workflow
```
Purchase Receipt → Photo Upload → Admin Verification → Coin Distribution → Balance Update
```

### 3. Redeeming Coins Workflow
```
Select Brand → Enter Bill Amount → Calculate Redemption → Admin Approval → UPI Transfer
```

### 4. Admin Verification Workflow
```
Pending Requests → Receipt Review → Validation → Approval/Rejection → Status Update
```

## 📱 Frontend Applications

### Mobile App (Expo)
**Location**: `apps/mobile/`
**Purpose**: Primary user interface for earning/redeeming coins

**Key Screens**:
- Authentication (OTP/OAuth)
- Dashboard (Balance, Recent Transactions)
- Brand Discovery
- Bill Upload (Camera + Gallery)
- Transaction History
- Profile Management
- Settings

**State Management**: React Context or Redux
**Styling**: NativeWind (Tailwind for React Native)
**Navigation**: React Navigation

### Admin Portal (Next.js)
**Location**: `apps/admin/`
**Purpose**: Admin dashboard for request management

**Key Pages**:
- Authentication (Domain-restricted: @clubcorra.com)
- Dashboard (Overview, Statistics)
- Request Management (Earn/Redeem)
- Brand Management (CRUD operations)
- User Management
- Analytics & Reports

**State Management**: React Context or SWR
**Styling**: Tailwind CSS + shadcn/ui
**Authentication**: Auth.js (NextAuth) or Clerk

## 🔌 Backend API (NestJS)

**Location**: `apps/api/`
**Purpose**: Core business logic and data persistence

### Core Modules
1. **Auth Module**
   - JWT-based authentication
   - OTP generation/verification
   - OAuth 2.0 integration
   - Role-based access control

2. **User Module**
   - User CRUD operations
   - Profile management
   - Payment details (UPI)
   - Welcome bonus processing

3. **Brand Module**
   - Brand CRUD operations
   - Earning/redemption rules
   - Category management

4. **Transaction Module**
   - Earn/redemption requests
   - Receipt processing
   - Status management
   - Audit trail

5. **File Module**
   - S3 signed URL generation
   - Image upload handling
   - Receipt storage

### API Endpoints Structure

#### Authentication
```
POST   /auth/signup
POST   /auth/login
POST   /auth/otp/send
POST   /auth/otp/verify
POST   /auth/refresh
POST   /auth/logout
```

#### Users
```
GET    /users/profile
PUT    /users/profile
PUT    /users/payment-details
GET    /users/transactions
POST   /users/welcome-bonus
```

#### Brands
```
GET    /brands
GET    /brands/:id
POST   /brands (admin only)
PUT    /brands/:id (admin only)
DELETE /brands/:id (admin only)
```

#### Transactions
```
POST   /transactions/earn
POST   /transactions/redeem
GET    /transactions
GET    /transactions/:id
PUT    /transactions/:id/status (admin only)
```

#### Files
```
POST   /files/upload-url
GET    /files/:id
DELETE /files/:id
```

## 🗄️ Database Schema (PostgreSQL + TypeORM)

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'PENDING',
  is_mobile_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  has_welcome_bonus_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  profile_picture VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Brands Table
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  earning_percentage DECIMAL(5,2) NOT NULL,
  redemption_percentage DECIMAL(5,2) NOT NULL,
  min_redemption_amount DECIMAL(10,2),
  max_redemption_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  type VARCHAR(20) NOT NULL, -- 'EARN' or 'REDEEM'
  amount DECIMAL(10,2) NOT NULL,
  bill_amount DECIMAL(10,2),
  coins_earned DECIMAL(10,2),
  coins_redeemed DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'PENDING',
  receipt_url VARCHAR(500),
  admin_notes TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### OTP Verifications Table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mobile_number VARCHAR(15),
  email VARCHAR(255),
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Relationships
- **Users** → **UserProfiles** (1:1)
- **Users** → **Transactions** (1:many)
- **Brands** → **Transactions** (1:many)
- **Users** → **OTPVerifications** (1:many)

## 🔗 Shared Package Integration

**Location**: `packages/shared/`
**Purpose**: Common types, utilities, and validation schemas

### Exported Modules
- **Types**: User, Brand, Transaction interfaces
- **Enums**: UserStatus, VerificationStatus, AuthProvider
- **Utilities**: OTP generation, validation functions
- **Constants**: Configuration values, limits

### Usage Across Apps
- **Mobile**: Import types for API calls, form validation
- **Admin**: Import types for data display, form handling
- **API**: Import types for request/response validation

## 🚨 Identified Issues & Fixes Required

### 1. **Missing Implementation Files**
**Issue**: Core application files are not yet implemented
**Impact**: Cannot run or test the applications
**Fix Required**: 
- Create basic app structure for all three applications
- Implement core components and pages
- Set up proper routing and navigation

### 2. **Dependency Version Mismatches**
**Issue**: TypeScript version (4.9.5) is outdated
**Impact**: May cause compatibility issues with modern libraries
**Fix Required**: 
- Update TypeScript to latest LTS version (5.x)
- Update other dependencies to compatible versions
- Ensure all packages use consistent dependency versions

### 3. **Missing Database Migrations**
**Issue**: No TypeORM entities or migrations defined
**Impact**: Database schema not implemented
**Fix Required**:
- Create TypeORM entities matching the schema design
- Generate and run initial migrations
- Set up database connection configuration

### 4. **Incomplete Shared Package**
**Issue**: Shared package has basic types but missing core business logic types
**Impact**: Incomplete type definitions for full application
**Fix Required**:
- Add missing types (Brand, Transaction, etc.)
- Create Zod validation schemas
- Add business logic utilities

### 5. **Missing Configuration Files**
**Issue**: No environment configuration, database config, or deployment configs
**Impact**: Applications cannot be configured or deployed
**Fix Required**:
- Create environment variable templates
- Set up database configuration
- Configure build and deployment pipelines

### 6. **Metro Configuration Missing**
**Issue**: No Metro configuration for mobile app to resolve workspace packages
**Impact**: Mobile app cannot import shared package
**Fix Required**:
- Configure Metro to watch workspace packages
- Set up proper module resolution
- Ensure shared package transpilation

### 7. **Missing Testing Setup**
**Issue**: No test configuration or test files
**Impact**: Cannot validate code quality or functionality
**Fix Required**:
- Set up Jest/Vitest configuration
- Create test utilities and mocks
- Add basic test coverage

## 🔧 Dependencies Compatibility Analysis

### ✅ Compatible Dependencies
- **Yarn Berry + node_modules**: Properly configured
- **TypeScript 4.9.5**: Compatible with all frameworks
- **Turbo 1.10.16**: Latest version, fully compatible
- **Zod 3.22.4**: Compatible with all TypeScript versions

### ⚠️ Potential Compatibility Issues
- **TypeScript 4.9.5**: May have issues with latest Next.js/Expo versions
- **Node.js >=16.14.0**: Minimum version should be updated to 18+
- **Missing peer dependencies**: Some packages may need explicit peer dependency declarations

### 🔄 Recommended Updates
1. **TypeScript**: Update to 5.3.x LTS
2. **Node.js**: Update minimum to 18.x LTS
3. **Next.js**: Ensure compatibility with TypeScript 5.x
4. **Expo**: Update to latest SDK with TypeScript 5.x support

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up basic app structure for all three applications
- [ ] Create database entities and initial migration
- [ ] Implement shared package with complete types
- [ ] Set up basic authentication flow

### Phase 2: Core Features (Week 3-4)
- [ ] Implement user registration and OTP verification
- [ ] Create brand management system
- [ ] Build transaction processing logic
- [ ] Set up file upload and S3 integration

### Phase 3: UI Implementation (Week 5-6)
- [ ] Build mobile app screens and navigation
- [ ] Create admin portal dashboard and forms
- [ ] Implement responsive design and accessibility
- [ ] Add error handling and loading states

### Phase 4: Integration & Testing (Week 7-8)
- [ ] End-to-end testing of all workflows
- [ ] Performance optimization and caching
- [ ] Security audit and penetration testing
- [ ] Deployment preparation and CI/CD setup

## 🎯 Success Criteria

### Technical Requirements
- [ ] All applications build and run successfully
- [ ] Database migrations execute without errors
- [ ] Shared package resolves correctly in all apps
- [ ] API endpoints return proper responses
- [ ] Mobile app can import and use shared types

### Functional Requirements
- [ ] User registration and authentication works
- [ ] Bill upload and verification flow functions
- [ ] Coin earning and redemption processes correctly
- [ ] Admin can manage requests and brands
- [ ] All CRUD operations work as expected

### Quality Requirements
- [ ] TypeScript compilation passes without errors
- [ ] Linting and formatting rules are enforced
- [ ] Basic test coverage is implemented
- [ ] Error handling is comprehensive
- [ ] Security best practices are followed

## 📚 Additional Resources

### Documentation
- [Product Brief](./PRODUCT_BRIEF.md)
- [Setup Instructions](./SETUP_INSTRUCTIONS.md)
- [Cursor Rules](./.cursorrules)

### External Dependencies
- **Neon PostgreSQL**: Database hosting
- **AWS S3**: File storage
- **CloudFront**: CDN for assets
- **Vercel**: Admin portal hosting
- **Expo EAS**: Mobile app builds

### Development Tools
- **ESLint + Prettier**: Code quality
- **Husky + lint-staged**: Pre-commit hooks
- **Jest/Vitest**: Testing framework
- **Sentry**: Error monitoring
- **Pino**: Backend logging

---

*This document serves as the comprehensive technical specification for the Club Corra pilot project. All development should follow the patterns and requirements outlined herein.*
