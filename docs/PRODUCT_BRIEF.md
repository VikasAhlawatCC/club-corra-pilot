# Club Corra - Product Brief

## 1. Project Overview / Description

Club Corra is a mobile loyalty and rewards application that enables users to earn and redeem "Corra Coins" through brand partnerships. The app operates on a bill-upload verification model where users upload purchase receipts to earn coins or redeem existing coins against future purchases. The system includes an admin portal for request verification and brand management, ensuring quality control and fraud prevention.

## 2. Target Audience

- **Primary**: Mobile users seeking loyalty rewards across multiple brand partnerships
- **Secondary**: Brand partners looking to increase customer engagement and retention
- **Tertiary**: Admin users managing verification workflows and brand relationships

## 3. Primary Benefits / Features

### User Features
- **Signup & Authentication**: Mobile number + OTP or OAuth 2.0, with UPI/payment details collection
- **Welcome Bonus**: 100 Corra Coins upon account creation
- **Brand Discovery**: Browse partner brands with earning/redeeming capabilities
- **Earn Coins**: Upload bill images to earn brand-specific percentage of MRP
- **Redeem Coins**: Use coins to reduce bills (limited by brand rules and balance)
- **Transaction History**: Track all earn/redeem requests with status updates
- **Suggestions**: Submit brand and category recommendations

### Admin Features
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

### Mobile App
- **Platform**: React Native (Expo) for cross-platform compatibility
- **UI Framework**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context or Redux for app state
- **Image Handling**: Camera integration and file upload capabilities

### Backend System
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM for data persistence
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
