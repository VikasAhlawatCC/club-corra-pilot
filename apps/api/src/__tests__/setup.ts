// Global test configuration
beforeAll(async () => {
  // Increase timeout for integration tests
  jest.setTimeout(60000);
});

afterAll(async () => {
  // Cleanup global resources
  jest.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestUser: (overrides = {}) => ({
    mobileNumber: `98765432${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
    email: `test${Date.now()}@example.com`,
    status: 'ACTIVE',
    isMobileVerified: true,
    isEmailVerified: true,
    hasWelcomeBonusProcessed: true,
    ...overrides,
  }),

  generateTestBrand: (overrides = {}) => ({
    name: `Test Brand ${Date.now()}`,
    description: `Test brand description ${Date.now()}`,
    earningPercentage: 30,
    redemptionPercentage: 100,
                    brandwiseMaxCap: 2000,
    isActive: true,
    ...overrides,
  }),

  generateTestTransaction: (overrides = {}) => ({
    type: 'EARN',
    status: 'PENDING',
    billAmount: 1000,
    coinsEarned: 300,
    billDate: new Date(),
    receiptUrl: 'https://example.com/receipt.jpg',
    ...overrides,
  }),

  // Generate test JWT tokens
  generateTestToken: (payload = {}) => {
    const defaultPayload = {
      sub: 'test-user-123',
      email: 'test@example.com',
      role: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      ...payload,
    };

    // Simple token generation for testing (not cryptographically secure)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadB64 = Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
    const signature = Buffer.from('test-signature').toString('base64');
    
    return `${header}.${payloadB64}.${signature}`;
  },

  generateAdminToken: (role = 'ADMIN') => {
    return global.testUtils.generateTestToken({
      sub: 'admin-123',
      email: 'admin@clubcorra.com',
      role,
    });
  },

  // Database utilities
  clearDatabase: async (dataSource: any) => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  },

  // Test assertions
  expectTransactionToBeValid: (transaction: any) => {
    expect(transaction).toHaveProperty('id');
    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('status');
    expect(transaction).toHaveProperty('createdAt');
    expect(transaction).toHaveProperty('updatedAt');
  },

  expectUserToBeValid: (user: any) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('mobileNumber');
    expect(user).toHaveProperty('status');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  },

  expectBrandToBeValid: (brand: any) => {
    expect(brand).toHaveProperty('id');
    expect(brand).toHaveProperty('name');
    expect(brand).toHaveProperty('earningPercentage');
    expect(brand).toHaveProperty('redemptionPercentage');
    expect(brand).toHaveProperty('isActive');
  },

  // Performance testing utilities
  measurePerformance: async (operation: () => Promise<any>, operationName = 'Operation') => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    const result = await operation();
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const duration = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    console.log(`Performance: ${operationName}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Memory Delta: ${JSON.stringify(memoryDelta, null, 2)}`);
    
    return {
      result,
      duration,
      memoryDelta,
    };
  },

  // Security testing utilities
  generateMaliciousPayloads: () => ({
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
      "' OR 1=1; --",
    ],
    xss: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '"><script>alert("xss")</script>',
      'javascript:void(alert("xss"))',
    ],
    pathTraversal: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ],
    commandInjection: [
      '; rm -rf /',
      '| cat /etc/passwd',
      '&& whoami',
      '$(id)',
      '`whoami`',
    ],
  }),

  // Rate limiting utilities
  generateConcurrentRequests: (count: number, requestFn: () => Promise<any>) => {
    return Array.from({ length: count }, () => requestFn());
  },

  // WebSocket testing utilities
  createMockSocket: (overrides = {}) => ({
    id: `socket-${Date.now()}`,
    userId: `user-${Date.now()}`,
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  }),

  // Validation utilities
  expectValidationError: (response: any, expectedFields: string[]) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    
    expectedFields.forEach(field => {
      expect(response.body.error.message).toContain(field);
    });
  },

  expectUnauthorizedError: (response: any) => {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTHENTICATION_FAILED');
  },

  expectForbiddenError: (response: any) => {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTHORIZATION_FAILED');
  },

  expectNotFoundError: (response: any) => {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
  },

  // Business logic validation utilities
  expectBusinessRuleViolation: (response: any, expectedCode: string) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', expectedCode);
  },

  // File upload testing utilities
  generateTestFile: (overrides = {}) => ({
    fileName: 'test-receipt.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024 * 1024, // 1MB
    ...overrides,
  }),

  generateMaliciousFile: () => ({
    fileName: 'malicious.exe',
    fileType: 'application/x-msdownload',
    fileSize: 1024,
  }),

  // Notification testing utilities
  expectNotificationToBeValid: (notification: any) => {
    expect(notification).toHaveProperty('id');
    expect(notification).toHaveProperty('type');
    expect(notification).toHaveProperty('message');
    expect(notification).toHaveProperty('isRead');
    expect(notification).toHaveProperty('createdAt');
  },

  // Balance testing utilities
  expectBalanceToBeValid: (balance: any) => {
    expect(balance).toHaveProperty('balance');
    expect(balance).toHaveProperty('totalEarned');
    expect(balance).toHaveProperty('totalRedeemed');
    expect(balance).toHaveProperty('lastUpdated');
  },
};



// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests
});
