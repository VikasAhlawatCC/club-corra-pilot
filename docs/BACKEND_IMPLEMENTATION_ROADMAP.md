# Backend Implementation Roadmap

## Overview

This document serves as the comprehensive implementation roadmap for the Club Corra backend API. It outlines all intended behavior, services, routes, and business logic that must be implemented to complete the system.

## Implementation Status Legend

- 🔴 **Not Started**: Feature not yet implemented
- 🟡 **In Progress**: Feature partially implemented  
- 🟢 **Completed**: Feature fully implemented and tested
- 🔵 **Blocked**: Feature blocked by dependencies

## Core Architecture Status

### Database Schema
- 🟢 **Users & Authentication**: Complete with OAuth, SMS, email support
- 🟢 **Brands & Categories**: Complete with earning/redemption caps
- 🟢 **Coin Transactions**: Complete with all required fields
- 🟢 **Coin Balances**: Complete with audit trail
- 🟢 **Notifications**: Complete with type-based categorization
- 🟢 **Global Configuration**: Complete with category-based organization
- 🟢 **Files**: Complete with S3 integration
- 🟢 **Migrations**: All required migrations implemented

### Infrastructure
- 🟢 **WebSocket**: Connection management implemented
- 🟢 **Rate Limiting**: Basic rate limiting implemented
- 🟢 **Health Checks**: Comprehensive health monitoring
- 🟢 **Error Handling**: Basic error handling implemented
- 🟢 **Logging**: Basic logging implemented

## Service Layer Implementation

### 1. Authentication Service (`/src/auth/`)

#### 1.1 User Authentication
**Status**: 🟢 **Completed**
- ✅ User signup with mobile/email/OTP
- ✅ OAuth integration (Google, Facebook)
- ✅ JWT token generation and validation
- ✅ Refresh token mechanism
- ✅ Logout functionality

#### 1.2 Admin Authentication
**Status**: 🔴 **Not Started**
- 🔴 Admin signup (restricted to @clubcorra.com domain)
- 🔴 Admin role management (SUPER_ADMIN, ADMIN, MODERATOR)
- 🔴 Admin-specific JWT validation
- 🔴 Admin session management

**Required Implementation**:
```typescript
// apps/api/src/auth/services/admin-auth.service.ts
@Injectable()
export class AdminAuthService {
  async adminSignup(adminSignupDto: AdminSignupDto): Promise<AdminAuthResponse>
  async adminLogin(adminLoginDto: AdminLoginDto): Promise<AdminAuthResponse>
  async validateAdminDomain(email: string): Promise<boolean>
  async assignAdminRole(adminId: string, role: AdminRole): Promise<void>
}
```

### 2. User Management Service (`/src/users/`)

#### 2.1 User Profile Management
**Status**: 🟢 **Completed**
- ✅ Get user profile
- ✅ Update user profile
- ✅ Payment details management
- ✅ Profile picture handling

#### 2.2 User Balance Management
**Status**: 🟡 **Partially Implemented**
- ✅ Basic balance retrieval
- ✅ Balance updates for transactions
- 🔴 Balance rollback for rejected transactions
- 🔴 Balance history and audit trail
- 🔴 Balance validation rules

**Required Implementation**:
```typescript
// apps/api/src/users/services/user-balance.service.ts
@Injectable()
export class UserBalanceService {
  async getBalanceHistory(userId: string, filters: BalanceHistoryFilters): Promise<BalanceHistoryResult>
  async rollbackBalance(userId: string, transactionId: string, amount: number): Promise<void>
  async validateBalanceForRedemption(userId: string, amount: number): Promise<BalanceValidationResult>
  async getBalanceAuditTrail(userId: string): Promise<BalanceAuditEntry[]>
}
```

### 3. Coin Transaction Service (`/src/coins/`)

#### 3.1 Transaction Creation
**Status**: 🟡 **Partially Implemented**
- ✅ Basic earn request creation
- ✅ Basic redeem request creation
- ✅ Welcome bonus creation
- 🔴 Transaction validation rules
- 🔴 Business rule enforcement
- 🔴 Fraud prevention checks

**Required Implementation**:
```typescript
// apps/api/src/coins/services/transaction-validation.service.ts
@Injectable()
export class TransactionValidationService {
  async validateEarnRequest(userId: string, brandId: string, billAmount: number, billDate: Date): Promise<ValidationResult>
  async validateRedeemRequest(userId: string, brandId: string, coinsToRedeem: number): Promise<ValidationResult>
  async checkPendingRequests(userId: string): Promise<PendingRequestsCheck>
  async validateBrandCaps(brandId: string, userId: string, amount: number, type: 'EARN' | 'REDEEM'): Promise<CapValidationResult>
  async checkFraudPrevention(userId: string, brandId: string): Promise<FraudPreventionResult>
}
```

#### 3.2 Transaction Approval/Rejection
**Status**: 🔴 **Not Started**
- 🔴 Admin approval workflow for earn requests
- 🔴 Admin approval workflow for redeem requests
- 🔴 Transaction rejection with reason tracking
- 🔴 Balance rollback for rejected transactions
- 🔴 Notification system for status changes

**Required Implementation**:
```typescript
// apps/api/src/coins/services/transaction-approval.service.ts
@Injectable()
export class TransactionApprovalService {
  async approveEarnRequest(transactionId: string, adminNotes?: string): Promise<TransactionApprovalResult>
  async rejectEarnRequest(transactionId: string, reason: string, adminNotes?: string): Promise<TransactionRejectionResult>
  async approveRedeemRequest(transactionId: string, adminNotes?: string): Promise<TransactionApprovalResult>
  async rejectRedeemRequest(transactionId: string, reason: string, adminNotes?: string): Promise<TransactionRejectionResult>
  async rollbackTransaction(transactionId: string): Promise<void>
}
```

#### 3.3 Payment Processing
**Status**: 🔴 **Not Started**
- 🔴 Manual payment completion workflow
- 🔴 Payment status update to PAID
- 🔴 Payment timestamp recording
- 🔴 User notification system
- 🔴 Payment audit trail

**Required Implementation**:
```typescript
// apps/api/src/coins/services/payment-processing.service.ts
@Injectable()
export class PaymentProcessingService {
  async markPaymentAsComplete(transactionId: string, adminNotes?: string): Promise<PaymentResult>
  async updatePaymentStatus(transactionId: string, status: 'PAID'): Promise<CoinTransaction>
  async recordPaymentCompletion(transactionId: string): Promise<void>
  async notifyUserOfPaymentCompletion(transactionId: string): Promise<void>
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]>
}
```

### 4. File Management Service (`/src/files/`)

#### 4.1 File Upload
**Status**: 🟢 **Completed**
- ✅ S3 signed URL generation
- ✅ File type validation
- ✅ File size validation
- ✅ Upload confirmation
- ✅ Receipt validation

#### 4.2 File Processing
**Status**: 🔴 **Not Started**
- 🔴 Image optimization and compression
- 🔴 OCR processing for receipts
- 🔴 File metadata extraction
- 🔴 File quality assessment
- 🔴 Duplicate file detection

**Required Implementation**:
```typescript
// apps/api/src/files/services/file-processing.service.ts
@Injectable()
export class FileProcessingService {
  async optimizeImage(fileKey: string): Promise<OptimizationResult>
  async extractReceiptData(fileKey: string): Promise<ReceiptData>
  async assessFileQuality(fileKey: string): Promise<QualityAssessment>
  async detectDuplicateFiles(fileKey: string, userId: string): Promise<DuplicateDetectionResult>
  async generateThumbnail(fileKey: string): Promise<string>
}
```

### 5. Notification Service (`/src/notifications/`)

#### 5.1 Basic Notifications
**Status**: 🟢 **Completed**
- ✅ User notification creation
- ✅ Notification retrieval
- ✅ Mark as read functionality
- ✅ Delete notifications

#### 5.2 Advanced Notifications
**Status**: 🔴 **Not Started**
- 🔴 Push notification delivery
- 🔴 Email notification system
- 🔴 SMS notification system
- 🔴 Notification templates
- 🔴 Notification scheduling

**Required Implementation**:
```typescript
// apps/api/src/notifications/services/notification-delivery.service.ts
@Injectable()
export class NotificationDeliveryService {
  async sendPushNotification(userId: string, notification: Notification): Promise<PushDeliveryResult>
  async sendEmailNotification(userId: string, notification: Notification): Promise<EmailDeliveryResult>
  async sendSMSNotification(userId: string, notification: Notification): Promise<SMSDeliveryResult>
  async scheduleNotification(notification: ScheduledNotification): Promise<void>
  async processNotificationQueue(): Promise<void>
}
```

### 6. WebSocket Service (`/src/websocket/`)

#### 6.1 Connection Management
**Status**: 🟢 **Completed**
- ✅ User connection management
- ✅ Admin connection management
- ✅ Connection health monitoring
- ✅ Basic event broadcasting

#### 6.2 Real-time Features
**Status**: 🔴 **Not Started**
- 🔴 Real-time balance updates
- 🔴 Transaction status updates
- 🔴 Admin notification broadcasting
- 🔴 User presence tracking
- 🔴 Room-based messaging

**Required Implementation**:
```typescript
// apps/api/src/websocket/services/real-time.service.ts
@Injectable()
export class RealTimeService {
  async broadcastBalanceUpdate(userId: string, oldBalance: number, newBalance: number): Promise<void>
  async broadcastTransactionUpdate(userId: string, transaction: CoinTransaction): Promise<void>
  async notifyAdminsOfPendingRequest(transaction: CoinTransaction): Promise<void>
  async trackUserPresence(userId: string, status: 'ONLINE' | 'OFFLINE'): Promise<void>
  async sendRoomMessage(roomId: string, message: RoomMessage): Promise<void>
}
```

## Controller Layer Implementation

### 1. Authentication Controller (`/src/auth/auth.controller.ts`)
**Status**: 🟢 **Completed**
- ✅ All authentication endpoints implemented
- ✅ OAuth integration complete
- ✅ JWT token management complete

### 2. User Controller (`/src/users/users.controller.ts`)
**Status**: 🟡 **Partially Implemented**
- ✅ Basic profile management
- 🔴 Balance history endpoints
- 🔴 User analytics endpoints
- 🔴 Admin user management endpoints

**Required Endpoints**:
```typescript
// Balance history
@Get('balance/history')
async getBalanceHistory(@Query() filters: BalanceHistoryFilters, @Request() req)

// User analytics
@Get('analytics')
async getUserAnalytics(@Query() timeRange: TimeRange, @Request() req)

// Admin endpoints
@Get('admin/users')
async getAllUsers(@Query() filters: UserFilters, @UseGuards(AdminGuard) @Request() req)

@Put('admin/users/:id/status')
async updateUserStatus(@Param('id') id: string, @Body() statusDto: UpdateUserStatusDto, @UseGuards(AdminGuard) @Request() req)
```

### 3. Coin Admin Controller (`/src/coins/controllers/coin-admin.controller.ts`)
**Status**: 🔴 **Not Started**
- 🔴 Transaction approval/rejection endpoints
- 🔴 Payment processing endpoints
- 🔴 Admin dashboard endpoints
- 🔴 Transaction management endpoints

**Required Endpoints**:
```typescript
// Transaction management
@Put('transactions/:id/approve')
async approveTransaction(@Param('id') id: string, @Body() approveDto: ApproveTransactionDto, @UseGuards(AdminGuard) @Request() req)

@Put('transactions/:id/reject')
async rejectTransaction(@Param('id') id: string, @Body() rejectDto: RejectTransactionDto, @UseGuards(AdminGuard) @Request() req)

@Put('transactions/:id/mark-paid')
async markPaymentAsComplete(@Param('id') id: string, @Body() markPaidDto: MarkPaidDto, @UseGuards(AdminGuard) @Request() req)

// Admin dashboard
@Get('dashboard/stats')
async getDashboardStats(@UseGuards(AdminGuard) @Request() req)

@Get('dashboard/recent-activity')
async getRecentActivity(@UseGuards(AdminGuard) @Request() req)

@Get('dashboard/brand-performance')
async getBrandPerformance(@UseGuards(AdminGuard) @Request() req)
```

## Business Logic Implementation

### 1. Transaction Workflow Engine
**Status**: 🔴 **Not Started**

**Required Implementation**:
```typescript
// apps/api/src/coins/services/transaction-workflow.service.ts
@Injectable()
export class TransactionWorkflowService {
  // Earn Request Workflow
  async processEarnRequest(earnRequest: CreateEarnRequestDto, userId: string): Promise<EarnRequestResult>
  async validateEarnRequest(earnRequest: CreateEarnRequestDto, userId: string): Promise<ValidationResult>
  async approveEarnRequest(transactionId: string, adminNotes?: string): Promise<ApprovalResult>
  async rejectEarnRequest(transactionId: string, reason: string, adminNotes?: string): Promise<RejectionResult>

  // Redemption Request Workflow
  async processRedeemRequest(redeemRequest: CreateRedeemRequestDto, userId: string): Promise<RedeemRequestResult>
  async validateRedeemRequest(redeemRequest: CreateRedeemRequestDto, userId: string): Promise<ValidationResult>
  async approveRedeemRequest(transactionId: string, adminNotes?: string): Promise<ApprovalResult>
  async rejectRedeemRequest(transactionId: string, reason: string, adminNotes?: string): Promise<RejectionResult>

  // Payment Processing Workflow
  async markPaymentAsComplete(transactionId: string, adminNotes?: string): Promise<PaymentResult>
  async updatePaymentStatus(transactionId: string, status: 'PAID'): Promise<CoinTransaction>
  async recordPaymentCompletion(transactionId: string): Promise<void>
}
```

### 2. Business Rule Engine
**Status**: 🔴 **Not Started**

**Required Implementation**:
```typescript
// apps/api/src/coins/services/business-rule-engine.service.ts
@Injectable()
export class BusinessRuleEngineService {
  // Brand Cap Validation
  async validateBrandEarningCap(brandId: string, userId: string, amount: number): Promise<CapValidationResult>
  async validateBrandRedemptionCap(brandId: string, userId: string, amount: number): Promise<CapValidationResult>
  async checkOverallBrandCap(brandId: string, amount: number): Promise<CapValidationResult>

  // User Balance Validation
  async validateUserBalanceForRedemption(userId: string, amount: number): Promise<BalanceValidationResult>
  async checkPendingRequests(userId: string): Promise<PendingRequestsCheck>
  async validateUserEligibility(userId: string, brandId: string): Promise<EligibilityResult>

  // Fraud Prevention
  async checkFraudPrevention(userId: string, brandId: string, billAmount: number): Promise<FraudPreventionResult>
  async validateBillAge(billDate: Date): Promise<BillAgeValidationResult>
  async checkDuplicateSubmissions(userId: string, brandId: string, billDate: Date): Promise<DuplicateCheckResult>
}
```

## Security Implementation

### 1. Authentication & Authorization
**Status**: 🟡 **Partially Implemented**
- ✅ Basic JWT authentication
- 🔴 Role-based access control (RBAC)
- 🔴 Permission-based authorization
- 🔴 API key management for external services

**Required Implementation**:
```typescript
// apps/api/src/auth/guards/rbac.guard.ts
@Injectable()
export class RBACGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Implement role-based access control
  }
}

// apps/api/src/auth/guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Implement permission-based authorization
  }
}
```

### 2. Input Validation & Sanitization
**Status**: 🟡 **Partially Implemented**
- ✅ Basic Zod schema validation
- 🔴 Advanced input sanitization
- 🔴 SQL injection prevention
- 🔴 XSS protection

**Required Implementation**:
```typescript
// apps/api/src/common/interceptors/input-sanitization.interceptor.ts
@Injectable()
export class InputSanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Implement input sanitization
  }
}
```

## Testing Implementation

### 1. Unit Tests
**Status**: 🟡 **Partially Implemented**
- ✅ Basic service tests
- 🔴 Comprehensive business logic tests
- 🔴 Edge case testing
- 🔴 Error handling tests

**Required Test Coverage**:
- All service methods: 100%
- All business logic: 100%
- All error scenarios: 100%
- All validation rules: 100%

### 2. Integration Tests
**Status**: 🟡 **Partially Implemented**
- ✅ Basic API endpoint tests
- 🔴 Database integration tests
- 🔴 External service integration tests
- 🔴 End-to-end workflow tests

**Required Test Scenarios**:
- Complete transaction workflow
- Admin approval/rejection workflow
- Manual payment completion workflow
- Real-time update workflow
- File upload and processing workflow

## Progress Tracking

### Phase 1: Core Business Logic (Week 1)
- [ ] Transaction approval/rejection service
- [ ] Manual payment completion service
- [ ] Business rule engine
- [ ] Transaction workflow engine

### Phase 2: Advanced Features (Week 2)
- [ ] Real-time update engine
- [ ] Notification engine
- [ ] File processing service
- [ ] Analytics services

### Phase 3: Security & Performance (Week 3)
- [ ] Advanced authentication & authorization
- [ ] Input validation & sanitization
- [ ] Rate limiting & DDoS protection
- [ ] Performance optimization

### Phase 4: Testing & Quality (Week 4)
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] Security tests

### Phase 5: Monitoring & Deployment (Week 5)
- [ ] Monitoring & observability
- [ ] Deployment automation
- [ ] Production readiness
- [ ] Documentation completion

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

This roadmap provides a comprehensive guide for implementing all required backend functionality for the Club Corra system. Each component is clearly defined with implementation status, required functionality, and success criteria. Following this roadmap will ensure a complete, production-ready backend system that meets all business requirements and technical standards.

The implementation should be approached in phases, with each phase building upon the previous one. Regular progress reviews against this roadmap will help identify any gaps or issues early in the development process.
