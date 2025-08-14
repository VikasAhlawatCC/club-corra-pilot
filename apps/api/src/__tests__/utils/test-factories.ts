import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { PaymentDetails } from '../../users/entities/payment-details.entity';

// Test data factories that match actual entity schemas
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): Partial<User> {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mobileNumber: `98765432${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      email: `test${Date.now()}@example.com`,
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createUserProfile(overrides: Partial<UserProfile> = {}): Partial<UserProfile> {
    return {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: `Test${Date.now()}`,
      lastName: `User${Date.now()}`,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      profilePicture: 'https://example.com/profile.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createPaymentDetails(overrides: Partial<PaymentDetails> = {}): Partial<PaymentDetails> {
    return {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      upiId: `test${Date.now()}@upi`,
      mobileNumber: `98765432${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createBrand(overrides: Partial<Brand> = {}): Partial<Brand> {
    return {
      id: `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Brand ${Date.now()}`,
      description: `Test brand description ${Date.now()}`,
      logoUrl: 'https://example.com/logo.png',
      categoryId: `category-${Date.now()}`,
      earningPercentage: 30,
      redemptionPercentage: 100,
      minRedemptionAmount: 1,
      maxRedemptionAmount: 2000,
      brandwiseMaxCap: 2000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createCoinBalance(overrides: Partial<CoinBalance> = {}): Partial<CoinBalance> {
    return {
      id: `balance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: `user-${Date.now()}`,
      balance: 500,
      totalEarned: 600,
      totalRedeemed: 100,
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createCoinTransaction(overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction> {
    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: `user-${Date.now()}`,
      brandId: `brand-${Date.now()}`,
      type: 'EARN',
      amount: 300,
      billAmount: 1000,
      coinsEarned: 300,
      coinsRedeemed: undefined,
      status: 'PENDING',
      receiptUrl: 'https://example.com/receipt.jpg',
      adminNotes: '',
      processedAt: undefined,
      transactionId: undefined,
      billDate: new Date(),
      paymentProcessedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createEarnTransaction(overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction> {
    return this.createCoinTransaction({
      type: 'EARN',
      amount: 300,
      coinsEarned: 300,
      coinsRedeemed: undefined,
      status: 'PENDING',
      ...overrides,
    });
  }

  static createRedeemTransaction(overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction> {
    return this.createCoinTransaction({
      type: 'REDEEM',
      amount: -100,
      coinsEarned: undefined,
      coinsRedeemed: 100,
      status: 'PENDING',
      ...overrides,
    });
  }

  static createApprovedTransaction(overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction> {
    return this.createCoinTransaction({
      status: 'APPROVED',
      processedAt: new Date(),
      ...overrides,
    });
  }

  static createPaidTransaction(overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction> {
    return this.createCoinTransaction({
      type: 'REDEEM',
      status: 'PAID',
      processedAt: new Date(),
      transactionId: `ADMIN_TX_${Date.now()}`,
      paymentProcessedAt: new Date(),
      ...overrides,
    });
  }

  static createNotification(overrides: Partial<Notification> = {}): Partial<Notification> {
    return {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: `user-${Date.now()}`,
      type: 'TRANSACTION_STATUS',
      title: 'Transaction Update',
      message: 'Your transaction status has been updated',
      isRead: false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // Bulk data generators for performance testing
  static createBulkTransactions(count: number, overrides: Partial<CoinTransaction> = {}): Partial<CoinTransaction>[] {
    return Array.from({ length: count }, (_, i) => 
      this.createCoinTransaction({
        id: `tx-bulk-${i}-${Date.now()}`,
        billAmount: 1000 + (i % 1000) * 10,
        coinsEarned: i % 2 === 0 ? 300 + (i % 100) * 3 : undefined,
        coinsRedeemed: i % 2 === 1 ? 100 + (i % 50) : undefined,
        type: i % 2 === 0 ? 'EARN' : 'REDEEM',
        status: i % 4 === 0 ? 'PENDING' : i % 4 === 1 ? 'APPROVED' : i % 4 === 2 ? 'REJECTED' : 'PAID',
        createdAt: new Date(Date.now() - (i % 365) * 86400000),
        ...overrides,
      })
    );
  }

  static createBulkUsers(count: number, overrides: Partial<User> = {}): Partial<User>[] {
    return Array.from({ length: count }, (_, i) => 
      this.createUser({
        id: `user-bulk-${i}-${Date.now()}`,
        mobileNumber: `98765432${i.toString().padStart(2, '0')}`,
        email: `test${i}@example.com`,
        ...overrides,
      })
    );
  }

  static createBulkBrands(count: number, overrides: Partial<Brand> = {}): Partial<Brand>[] {
    return Array.from({ length: count }, (_, i) => 
      this.createBrand({
        id: `brand-bulk-${i}-${Date.now()}`,
        name: `Test Brand ${i}`,
        earningPercentage: 25 + (i % 15),
        redemptionPercentage: 90 + (i % 10),
        ...overrides,
      })
    );
  }
}

// Test assertion utilities
export class TestAssertions {
  static expectTransactionToBeValid(transaction: any) {
    expect(transaction).toHaveProperty('id');
    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('status');
    expect(transaction).toHaveProperty('amount');
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');
    
    // Validate enum values
    expect(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT']).toContain(transaction.type);
    expect(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID']).toContain(transaction.status);
  }

  static expectUserToBeValid(user: any) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('mobileNumber');
    expect(user).toHaveProperty('status');
    expect(user).toHaveProperty('isMobileVerified');
    expect(user).toHaveProperty('isEmailVerified');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  }

  static expectBrandToBeValid(brand: any) {
    expect(brand).toHaveProperty('id');
    expect(brand).toHaveProperty('name');
    expect(brand).toHaveProperty('description');
    expect(brand).toHaveProperty('earningPercentage');
    expect(brand).toHaveProperty('redemptionPercentage');
    expect(brand).toHaveProperty('brandwiseMaxCap');
    expect(brand).toHaveProperty('isActive');
    expect(brand).toHaveProperty('createdAt');
    expect(brand).toHaveProperty('updatedAt');
  }

  static expectCoinBalanceToBeValid(balance: any) {
    expect(balance).toHaveProperty('id');
    expect(balance).toHaveProperty('userId');
    expect(balance).toHaveProperty('balance');
    expect(balance).toHaveProperty('totalEarned');
    expect(balance).toHaveProperty('totalRedeemed');
    expect(balance).toHaveProperty('lastUpdated');
    expect(balance).toHaveProperty('createdAt');
    expect(balance).toHaveProperty('updatedAt');
  }
}

// Performance testing utilities
export class PerformanceUtils {
  static async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`${operationName} completed in ${duration}ms`);
    return { result, duration };
  }

  static async measureConcurrentPerformance<T>(
    operations: (() => Promise<T>)[],
    operationName: string
  ): Promise<{ results: T[]; totalDuration: number; averageDuration: number }> {
    const startTime = Date.now();
    const results = await Promise.all(operations.map(op => op()));
    const totalDuration = Date.now() - startTime;
    const averageDuration = totalDuration / operations.length;
    
    console.log(`${operationName}: ${operations.length} operations completed in ${totalDuration}ms (avg: ${averageDuration}ms)`);
    return { results, totalDuration, averageDuration };
  }
}

// Security testing utilities
export class SecurityUtils {
  static generateMaliciousPayloads() {
    return {
      sqlInjection: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1; --",
        "'; WAITFOR DELAY '00:00:05'; --",
      ],
      xss: [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>',
      ],
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      ],
      noSqlInjection: [
        { $where: 'function() { return true; }' },
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
      ],
    };
  }

  static generateInvalidTokens() {
    return [
      'invalid.token.here',
      'Bearer invalid',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      'Bearer ',
      '',
      'null',
      'undefined',
      'Bearer null',
      'Bearer undefined',
    ];
  }
}
