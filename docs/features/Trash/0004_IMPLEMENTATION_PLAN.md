# Feature 0004: Implementation Plan

## Overview

This document provides a detailed implementation plan for completing the Coin Earning & Redemption System based on the current implementation status and the requirements outlined in the 0004_PLAN.md.

## Current Implementation Status

### ✅ Completed Components
- **Data Layer**: All required entities and migrations are implemented
- **Authentication System**: Complete OAuth, SMS, and email authentication
- **File Upload**: S3 integration with signed URLs
- **Basic Transaction Structure**: Earn and redeem request endpoints
- **Brand Management**: Complete CRUD operations with caps
- **Global Configuration**: Configurable system parameters
- **Notification System**: Basic notification infrastructure
- **WebSocket Infrastructure**: Connection management and basic events
- **Health Monitoring**: Comprehensive health checks

### 🔄 Partially Implemented
- **Transaction Business Logic**: Basic structure exists but approval/rejection workflow incomplete
- **Admin Management**: Endpoints exist but return "not implemented" responses
- **Real-time Updates**: WebSocket infrastructure ready but not fully integrated

### ❌ Missing Components
- **Transaction Approval/Rejection Workflow**: Core business logic for admin actions
- **Payment Processing**: Transaction ID validation and payment completion
- **Advanced Validation**: Business rule enforcement for pending requests
- **Balance Rollback**: Handling rejected earn requests

## Implementation Phases

### Phase 1: Complete Core Business Logic (Week 1)

#### 1.1 Implement Transaction Approval/Rejection Service
**File**: `apps/api/src/coins/services/transaction-approval.service.ts` (new)
```typescript
@Injectable()
export class TransactionApprovalService {
  async approveEarnRequest(transactionId: string, adminNotes?: string): Promise<TransactionApprovalResult>
  async rejectEarnRequest(transactionId: string, reason: string, adminNotes?: string): Promise<TransactionRejectionResult>
  async approveRedeemRequest(transactionId: string, adminNotes?: string): Promise<TransactionApprovalResult>
  async rejectRedeemRequest(transactionId: string, reason: string, adminNotes?: string): Promise<TransactionRejectionResult>
}
```

**Business Logic**:
- **Approve Earn**: Mark as APPROVED, finalize coin distribution
- **Reject Earn**: Mark as REJECTED, rollback coins from balance
- **Approve Redeem**: Mark as APPROVED, prepare for payment processing
- **Reject Redeem**: Mark as REJECTED, return reserved coins

#### 1.2 Implement Payment Processing Service
**File**: `apps/api/src/coins/services/payment-processing.service.ts` (new)
```typescript
@Injectable()
export class PaymentProcessingService {
  async processPayment(transactionId: string, adminTransactionId: string, adminNotes?: string): Promise<PaymentResult>
  async validateTransactionId(adminTransactionId: string): Promise<boolean>
  async generatePaymentReceipt(transactionId: string): Promise<PaymentReceipt>
}
```

**Business Logic**:
- Validate admin transaction ID format and uniqueness
- Update transaction status to PAID
- Record payment timestamp and transaction ID
- Send payment completion notification

#### 1.3 Enhance Coins Service
**File**: `apps/api/src/coins/coins.service.ts` (update existing methods)
```typescript
// Add these methods to existing CoinsService
async approveTransaction(transactionId: string, adminNotes?: string): Promise<CoinTransaction>
async rejectTransaction(transactionId: string, reason: string, adminNotes?: string): Promise<CoinTransaction>
async processPayment(transactionId: string, adminTransactionId: string, adminNotes?: string): Promise<CoinTransaction>
async getPendingTransactions(): Promise<PendingTransactionsResult>
async getAllTransactions(filters: AdminTransactionFilters): Promise<TransactionListResult>
```

#### 1.4 Update Admin Controller
**File**: `apps/api/src/coins/controllers/coin-admin.controller.ts` (update existing endpoints)
```typescript
// Replace "not implemented" responses with actual implementation
@Put('transactions/:id/approve')
async approveTransaction(@Param('id') id: string, @Body() approveDto: ApproveTransactionDto)

@Put('transactions/:id/reject')
async rejectTransaction(@Param('id') id: string, @Body() rejectDto: RejectTransactionDto)

@Put('transactions/:id/process-payment')
async processPayment(@Param('id') id: string, @Body() processPaymentDto: ProcessPaymentDto)

@Get('transactions/pending')
async getPendingTransactions(): Promise<PendingTransactionsResult>

@Get('transactions')
async getAllTransactions(@Query() filters: AdminTransactionFilters): Promise<TransactionListResult>
```

### Phase 2: Business Rule Validation (Week 1)

#### 2.1 Implement Transaction Validation Service
**File**: `apps/api/src/coins/services/transaction-validation.service.ts` (new)
```typescript
@Injectable()
export class TransactionValidationService {
  async validateEarnRequest(userId: string, brandId: string, billAmount: number, billDate: Date): Promise<ValidationResult>
  async validateRedeemRequest(userId: string, brandId: string, coinsToRedeem: number): Promise<ValidationResult>
  async checkPendingRequests(userId: string): Promise<PendingRequestsCheck>
  async validateBrandCaps(brandId: string, userId: string, amount: number, type: 'EARN' | 'REDEEM'): Promise<CapValidationResult>
}
```

**Validation Rules**:
- **Earn Requests**: Bill age limits, brand earning caps, fraud prevention
- **Redeem Requests**: Sufficient balance, pending earn requests processed, brand redemption caps
- **Brand Caps**: Overall and per-transaction limits enforcement

#### 2.2 Implement Bill Validation Service
**File**: `apps/api/src/coins/services/bill-validation.service.ts` (new)
```typescript
@Injectable()
export class BillValidationService {
  async validateBillAge(billDate: Date): Promise<BillAgeValidationResult>
  async validateBillAmount(amount: number, brandId: string): Promise<BillAmountValidationResult>
  async checkFraudPrevention(userId: string, brandId: string): Promise<FraudPreventionResult>
  async validateReceiptImage(fileKey: string): Promise<ReceiptValidationResult>
}
```

**Validation Rules**:
- Bill age must be within configured limit (default: 30 days)
- Bill amount must meet minimum threshold
- Fraud prevention: minimum time gap between submissions
- Receipt image quality and format validation

### Phase 3: Real-time Features (Week 2)

#### 3.1 Complete WebSocket Integration
**File**: `apps/api/src/websocket/websocket.gateway.ts` (enhance existing)
```typescript
// Add these event handlers
@SubscribeMessage('join_user_room')
async handleJoinUserRoom(client: Socket, payload: { userId: string })

@SubscribeMessage('join_admin_room')
async handleJoinAdminRoom(client: Socket, payload: { adminId: string })

@SubscribeMessage('transaction_status_update')
async handleTransactionStatusUpdate(client: Socket, payload: TransactionStatusUpdate)
```

#### 3.2 Implement Real-time Balance Updates
**File**: `apps/api/src/coins/services/balance-update.service.ts` (enhance existing)
```typescript
@Injectable()
export class BalanceUpdateService {
  async updateBalanceAndNotify(userId: string, amount: number, type: 'EARN' | 'REDEEM' | 'ADJUSTMENT'): Promise<void>
  async broadcastBalanceUpdate(userId: string, oldBalance: number, newBalance: number): Promise<void>
  async broadcastTransactionUpdate(userId: string, transaction: CoinTransaction): Promise<void>
  async notifyAdminsOfPendingRequest(transaction: CoinTransaction): Promise<void>
}
```

#### 3.3 Enhance Notification Service
**File**: `apps/api/src/notifications/notification.service.ts` (enhance existing)
```typescript
// Add these methods
async createTransactionNotification(userId: string, transaction: CoinTransaction, type: NotificationType): Promise<Notification>
async createAdminNotification(transaction: CoinTransaction, action: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<void>
async sendPushNotification(userId: string, notification: Notification): Promise<void>
```

### Phase 4: Admin Dashboard Features (Week 2)

#### 4.1 Implement Transaction Listing
**File**: `apps/api/src/coins/services/admin-transaction.service.ts` (new)
```typescript
@Injectable()
export class AdminTransactionService {
  async getTransactionsWithFilters(filters: AdminTransactionFilters): Promise<TransactionListResult>
  async getPendingTransactionsCount(): Promise<PendingTransactionsCount>
  async getTransactionStatistics(timeRange: TimeRange): Promise<TransactionStatistics>
  async exportTransactions(filters: AdminTransactionFilters, format: 'CSV' | 'EXCEL'): Promise<Buffer>
}
```

**Features**:
- Advanced filtering by user, brand, status, date range
- Pagination and sorting
- Transaction statistics and analytics
- Export functionality for reporting

#### 4.2 Implement Admin Dashboard Data
**File**: `apps/api/src/coins/controllers/coin-admin.controller.ts` (add new endpoints)
```typescript
@Get('dashboard/stats')
async getDashboardStats(): Promise<DashboardStats>

@Get('dashboard/recent-activity')
async getRecentActivity(): Promise<RecentActivity[]>

@Get('dashboard/brand-performance')
async getBrandPerformance(): Promise<BrandPerformance[]>
```

### Phase 5: Testing and Quality Assurance (Week 3)

#### 5.1 Unit Tests
**Files to Test**:
- `apps/api/src/coins/services/transaction-approval.service.spec.ts`
- `apps/api/src/coins/services/payment-processing.service.spec.ts`
- `apps/api/src/coins/services/transaction-validation.service.spec.ts`
- `apps/api/src/coins/services/bill-validation.service.spec.ts`

#### 5.2 Integration Tests
**Files to Test**:
- `apps/api/src/__tests__/integration/transaction-workflow.spec.ts`
- `apps/api/src/__tests__/integration/admin-workflow.spec.ts`
- `apps/api/src/__tests__/integration/real-time-updates.spec.ts`

#### 5.3 End-to-End Tests
**Files to Test**:
- `apps/api/src/__tests__/integration/end-to-end.spec.ts` (update existing)
- `apps/api/src/__tests__/integration/admin-e2e.spec.ts` (new)

### Phase 6: Mobile and Admin UI Integration (Week 3)

#### 6.1 Mobile App Updates
**Files to Update**:
- `apps/mobile/src/services/transactions.service.ts` (enhance existing)
- `apps/mobile/src/stores/transactions.store.ts` (enhance existing)
- `apps/mobile/src/screens/transactions/` (enhance existing screens)

**Features to Add**:
- Real-time balance updates
- Transaction status notifications
- Enhanced error handling
- Offline transaction queuing

#### 6.2 Admin Portal Updates
**Files to Update**:
- `apps/admin/src/components/transactions/TransactionTable.tsx` (enhance existing)
- `apps/admin/src/components/transactions/TransactionDetailModal.tsx` (enhance existing)
- `apps/admin/src/components/transactions/TransactionActionButtons.tsx` (enhance existing)

**Features to Add**:
- Transaction approval/rejection workflow
- Payment processing interface
- Real-time updates
- Advanced filtering and search

## Technical Implementation Details

### Database Transactions
All business logic operations must use database transactions to ensure data consistency:

```typescript
@Transaction()
async approveEarnRequest(transactionId: string, adminNotes?: string): Promise<TransactionApprovalResult> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // 1. Update transaction status
    // 2. Update user balance
    // 3. Create notification
    // 4. Send real-time update
    
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Error Handling
Implement comprehensive error handling with specific error codes:

```typescript
export class TransactionValidationError extends BadRequestException {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: any
  ) {
    super({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString()
    });
  }
}

// Usage
throw new TransactionValidationError(
  'INSUFFICIENT_BALANCE',
  'User does not have enough coins for redemption',
  { required: coinsToRedeem, available: userBalance }
);
```

### Rate Limiting
Implement rate limiting for critical endpoints:

```typescript
@UseInterceptors(new RateLimitInterceptor({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}))
@Post('earn')
async createEarnRequest(@Body() earnDto: CreateEarnRequestDto, @Request() req) {
  // Implementation
}
```

### Caching Strategy
Implement caching for frequently accessed data:

```typescript
@CacheKey('user_balance')
@CacheTTL(300) // 5 minutes
async getUserBalance(userId: string): Promise<CoinBalance> {
  // Implementation with Redis caching
}
```

## Configuration Updates

### Environment Variables
Add new environment variables for enhanced features:

```bash
# Transaction validation
MAX_BILL_AGE_DAYS=30
MIN_FRAUD_PREVENTION_HOURS=24
MIN_BILL_AMOUNT=10

# Payment processing
PAYMENT_TRANSACTION_ID_PATTERN=^[A-Z0-9]{8,20}$
ADMIN_NOTIFICATION_EMAIL=admin@clubcorra.com

# Real-time features
WEBSOCKET_HEARTBEAT_INTERVAL=30000
MAX_WEBSOCKET_CONNECTIONS=1000
```

### Global Configuration
Add new configuration keys:

```typescript
// Transaction validation
'MAX_BILL_AGE_DAYS': { value: '30', type: 'number', category: 'transaction' }
'MIN_FRAUD_PREVENTION_HOURS': { value: '24', type: 'number', category: 'transaction' }
'MIN_BILL_AMOUNT': { value: '10', type: 'number', category: 'transaction' }

// Payment processing
'PAYMENT_TRANSACTION_ID_PATTERN': { value: '^[A-Z0-9]{8,20}$', type: 'string', category: 'security' }
'ADMIN_NOTIFICATION_EMAIL': { value: 'admin@clubcorra.com', type: 'string', category: 'system' }
```

## Testing Strategy

### Test Data Setup
Create comprehensive test data factories:

```typescript
// apps/api/src/__tests__/utils/test-factories.ts
export class TransactionTestFactory {
  static createEarnRequest(overrides: Partial<CreateEarnRequestDto> = {}): CreateEarnRequestDto {
    return {
      brandId: faker.string.uuid(),
      billAmount: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
      billDate: faker.date.recent({ days: 7 }).toISOString(),
      receiptUrl: faker.internet.url(),
      notes: faker.lorem.sentence(),
      ...overrides
    };
  }
  
  static createRedeemRequest(overrides: Partial<CreateRedeemRequestDto> = {}): CreateRedeemRequestDto {
    return {
      brandId: faker.string.uuid(),
      billAmount: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
      coinsToRedeem: faker.number.int({ min: 1, max: 500 }),
      notes: faker.lorem.sentence(),
      ...overrides
    };
  }
}
```

### Test Scenarios
Cover all business logic scenarios:

1. **Earn Request Workflow**:
   - Valid earn request creation
   - Invalid brand or user
   - Insufficient brand caps
   - Bill validation failures

2. **Redemption Workflow**:
   - Valid redemption request
   - Insufficient balance
   - Pending earn requests
   - Brand cap violations

3. **Admin Approval/Rejection**:
   - Approve earn request
   - Reject earn request with rollback
   - Approve redemption request
   - Reject redemption request

4. **Payment Processing**:
   - Valid payment processing
   - Invalid transaction ID
   - Duplicate transaction ID

5. **Real-time Updates**:
   - Balance updates
   - Transaction status changes
   - Admin notifications

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] S3 bucket permissions verified
- [ ] WebSocket configuration tested

### Deployment
- [ ] Run database migrations
- [ ] Deploy API with new code
- [ ] Update environment variables
- [ ] Restart services
- [ ] Verify health checks

### Post-deployment
- [ ] Smoke tests for all endpoints
- [ ] Real-time feature verification
- [ ] Admin workflow testing
- [ ] Mobile app integration testing
- [ ] Performance monitoring

## Success Metrics

### Functional Metrics
- [ ] All transaction workflows complete successfully
- [ ] Real-time updates working for all users
- [ ] Admin dashboard fully functional
- [ ] Mobile app integration complete

### Performance Metrics
- [ ] Transaction processing < 2 seconds
- [ ] Real-time updates < 500ms
- [ ] API response time < 200ms
- [ ] WebSocket connection stability > 99%

### Quality Metrics
- [ ] Test coverage > 90%
- [ ] Zero critical bugs
- [ ] All business rules enforced
- [ ] Comprehensive error handling

## Risk Mitigation

### Technical Risks
1. **Database Performance**: Implement proper indexing and query optimization
2. **WebSocket Scalability**: Use Redis for horizontal scaling
3. **File Upload Issues**: Implement retry logic and validation
4. **Real-time Sync**: Implement fallback mechanisms for offline scenarios

### Business Risks
1. **Fraud Prevention**: Implement comprehensive validation and monitoring
2. **Data Consistency**: Use database transactions for all operations
3. **User Experience**: Provide clear error messages and status updates
4. **Admin Workflow**: Implement approval chains and audit logging

## Conclusion

This implementation plan provides a structured approach to completing Feature 0004. The plan focuses on:

1. **Completing core business logic** for transaction management
2. **Implementing comprehensive validation** for business rules
3. **Adding real-time features** for enhanced user experience
4. **Building admin dashboard** capabilities
5. **Ensuring quality** through comprehensive testing
6. **Managing deployment** with proper risk mitigation

By following this plan, the Club Corra system will have a complete, production-ready coin earning and redemption system that meets all the requirements outlined in the original plan.
