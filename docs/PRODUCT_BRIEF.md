# Club Corra - Product Brief

## 1. Project Overview / Description

Club Corra is a mobile loyalty and rewards application built as a monorepo using Yarn Workspaces + Turborepo. The system enables users to earn and redeem "Corra Coins" through brand partnerships using a bill-upload verification model. The architecture consists of three main applications: mobile app (Expo), admin portal (Next.js), and backend API (NestJS), all sharing common types and utilities.

## 2. Target Audience

- **Primary**: Mobile users seeking loyalty rewards across multiple brand partnerships
- **Secondary**: Brand partners looking to increase customer engagement and retention
- **Tertiary**: Admin users managing verification workflows and brand relationships

## 3. Primary Benefits / Features

### User Features
- **Signup & Authentication**: Mobile number with OTP(required) --> email OTP or OAuth 2.0(any one), with UPI ID details collection
- **Welcome Bonus**: 100 Corra Coins upon account creation
- **Brand Discovery**: Browse partner brands with earning/redeeming capabilities
- **Earn Coins**: Upload bill images to earn brand-specific percentage of MRP
- **Redeem Coins**: Use coins to reduce bills (limited by brand rules and balance)
- **Transaction History**: Track all earn/redeem requests with status updates
- **Suggestions**: Submit brand and category recommendations

### Admin Features
- **Signup & Authentication**: Using @clubcorra.com domain only
- **Request Verification**: Review pending earn/redeem requests with receipt validation
- **Manual Payment Processing**: Process approved redemption payments
- **Brand Management**: Add/edit/remove brands with earning/redeeming rules
- **Request Rejection**: Reject invalid requests with reason tracking

### Core Mechanics
- **Dynamic Percentages**: Brand-specific earning (y%) and redemption (x%) rates
- **Smart Limits**: Redemption capped at minimum of x% MRP and maximum redeemable amount
- **Pending State Management**: Earned coins immediate, redeemed amounts pending admin approval
- **Fraud Prevention**: Receipt verification workflow before coin distribution

## 4. High-Level Tech/Architecture

### Monorepo Structure
- **Package Manager**: Yarn Berry with node_modules linker
- **Build System**: Turborepo for efficient builds and caching
- **Shared Package**: Common TypeScript types, Zod schemas, and utilities

### Mobile App
- **Platform**: React Native (Expo) for cross-platform compatibility
- **UI Framework**: (go through the current codebase and what is implemented) (CSS framework for React Native as tailwind was might not be stable with the current techstack)
- **State Management**: React Context or Redux for app state
- **Image Handling**: Camera integration and file upload capabilities

### Backend System
- **Framework**: NestJS with TypeScript and TypeORM
- **Database**: PostgreSQL (Neon) with connection pooling
- **Authentication**: JWT-based auth with OAuth 2.0 support
- **File Storage**: S3-compatible storage for receipt images
- **Image Processing**: Receipt OCR and validation services

### Admin Portal
- **Web Application**: Next.js with Tailwind CSS and shadcn/ui
- **Admin Dashboard**: Request management, brand configuration, user oversight
- **Real-time Updates**: WebSocket integration for live status updates

### Infrastructure
- **Mobile**: Expo EAS Build and Submit for app distribution
- **Web Admin**: Vercel deployment with domain management
- **Backend**: AWS deployment (EC2/App Runner/ECS) with Docker containerization
- **Database**: Neon PostgreSQL with connection pooling
- **CDN**: CloudFront for static assets and receipt images

### Integration Points
- **Payment Processing**: Manual UPI transfers (admin-initiated)
- **External Forms**: Google Forms integration for brand suggestions
- **Analytics**: Transaction tracking and business intelligence
- **Notifications**: Push notifications for request status updates
