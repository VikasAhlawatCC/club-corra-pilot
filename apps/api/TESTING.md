# Testing Infrastructure Guide

This document provides a comprehensive guide to the testing infrastructure for the Club Corra API.

## Overview

The testing infrastructure is designed to provide comprehensive coverage across different types of tests:
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and performance validation
- **Security Tests**: Security audit and penetration testing
- **Real-time Tests**: WebSocket and real-time feature validation

## Test Structure

```
src/__tests__/
├── utils/                    # Test utilities and factories
│   ├── test-factories.ts    # Data factories for consistent test data
│   └── test-setup.ts        # Test setup and cleanup utilities
├── integration/             # Integration tests
├── performance/             # Performance tests
├── security/                # Security tests
├── realtime/                # Real-time feature tests
└── setup.ts                 # Global test configuration
```

## Quick Start

### Running All Tests
```bash
# Run all test types
npm run test:runner

# Run all tests with Jest directly
npm run test:all
```

### Running Specific Test Types
```bash
# Unit tests only
npm run test:unit
npm run test:runner unit

# Integration tests only
npm run test:integration
npm run test:runner integration

# Performance tests only
npm run test:performance
npm run test:runner performance

# Security tests only
npm run test:security
npm run test:runner security

# Real-time tests only
npm run test:realtime
npm run test:runner realtime
```

### Running with Coverage
```bash
# Run tests with coverage
npm run test:coverage
npm run test:runner coverage

# CI/CD testing
npm run test:ci
```

## Test Utilities

### TestDataFactory

The `TestDataFactory` class provides methods to create consistent test data that matches the actual entity schemas:

```typescript
import { TestDataFactory } from '../utils/test-factories';

// Create test entities
const user = TestDataFactory.createUser({
  mobileNumber: '9876543210',
  email: 'test@example.com'
});

const brand = TestDataFactory.createBrand({
  name: 'Test Brand',
  earningPercentage: 30
});

const transaction = TestDataFactory.createEarnTransaction({
  billAmount: 1000,
  coinsEarned: 300
});

// Create bulk data for performance testing
const bulkTransactions = TestDataFactory.createBulkTransactions(10000);
```

### TestAssertions

The `TestAssertions` class provides common validation methods:

```typescript
import { TestAssertions } from '../utils/test-factories';

// Validate entity structure
TestAssertions.expectTransactionToBeValid(transaction);
TestAssertions.expectUserToBeValid(user);
TestAssertions.expectBrandToBeValid(brand);
TestAssertions.expectCoinBalanceToBeValid(balance);
```

### PerformanceUtils

The `PerformanceUtils` class provides performance measurement utilities:

```typescript
import { PerformanceUtils } from '../utils/test-factories';

// Measure single operation performance
const { result, duration } = await PerformanceUtils.measurePerformance(
  async () => {
    return await repository.find();
  },
  'Database query'
);

// Measure concurrent operations
const { results, totalDuration, averageDuration } = await PerformanceUtils.measureConcurrentPerformance(
  operations,
  'Concurrent operations'
);
```

### SecurityUtils

The `SecurityUtils` class provides security testing payloads:

```typescript
import { SecurityUtils } from '../utils/test-factories';

// Get malicious payloads for testing
const { sqlInjection, xss, pathTraversal } = SecurityUtils.generateMaliciousPayloads();

// Get invalid tokens for testing
const invalidTokens = SecurityUtils.generateInvalidTokens();
```

## Test Setup and Teardown

### TestSetup Class

The `TestSetup` class manages test data lifecycle:

```typescript
import { getTestSetup, clearGlobalTestSetup } from '../utils/test-setup';

describe('My Tests', () => {
  let testSetup: any;

  beforeAll(async () => {
    testSetup = getTestSetup(dataSource);
  });

  afterAll(async () => {
    await testSetup.cleanup();
    clearGlobalTestSetup();
  });

  beforeEach(async () => {
    await testSetup.clearAllTestData();
    await testSetup.setupBasicTestData();
  });
});
```

### Available Setup Methods

- `setupBasicTestData()`: Creates minimal test data for basic tests
- `setupPerformanceTestData(count)`: Creates bulk data for performance testing
- `setupSecurityTestData()`: Creates data for security testing
- `setupRealTimeTestData()`: Creates data for real-time testing
- `clearAllTestData()`: Cleans up all test data

## Writing Tests

### Unit Tests

Unit tests focus on individual components and methods:

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    mockRepository = module.get(getRepositoryToken(User));
  });

  it('should create a user successfully', async () => {
    const userData = TestDataFactory.createUser();
    mockRepository.save.mockResolvedValue(userData);

    const result = await service.createUser(userData);

    expect(result).toEqual(userData);
    expect(mockRepository.save).toHaveBeenCalledWith(userData);
  });
});
```

### Integration Tests

Integration tests verify end-to-end workflows:

```typescript
describe('User Registration Flow', () => {
  it('should complete user registration successfully', async () => {
    // Setup test data
    const { testUser } = await testSetup.setupBasicTestData();

    // Execute workflow
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        mobileNumber: testUser.mobileNumber,
        email: testUser.email,
      })
      .expect(201);

    // Verify response
    expect(response.body).toHaveProperty('userId');
    expect(response.body.message).toBe('User registered successfully');

    // Verify database state
    const savedUser = await userRepository.findOne({
      where: { mobileNumber: testUser.mobileNumber }
    });
    expect(savedUser).toBeDefined();
    expect(savedUser.status).toBe('PENDING');
  });
});
```

### Performance Tests

Performance tests validate system performance under load:

```typescript
describe('Database Performance', () => {
  it('should handle large transaction queries efficiently', async () => {
    // Setup performance test data
    await testSetup.setupPerformanceTestData(10000);

    // Measure query performance
    const { result: transactions, duration } = await PerformanceUtils.measurePerformance(
      async () => {
        return await transactionRepository
          .createQueryBuilder('transaction')
          .where('transaction.status = :status', { status: 'PENDING' })
          .limit(100)
          .getMany();
      },
      'Large transaction query'
    );

    // Assert performance requirements
    expect(duration).toBeLessThan(1000); // < 1 second
    expect(transactions).toHaveLength(100);
  });
});
```

### Security Tests

Security tests validate security measures:

```typescript
describe('Input Validation Security', () => {
  it('should prevent SQL injection attacks', async () => {
    const { sqlInjection } = SecurityUtils.generateMaliciousPayloads();

    for (const payload of sqlInjection) {
      await request(app.getHttpServer())
        .post('/admin/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: payload,
          description: 'Test',
          earningPercentage: 30,
        })
        .expect(400); // Should reject malicious input
    }
  });
});
```

## Test Configuration

### Jest Configuration

The Jest configuration is split into multiple projects for different test types:

```javascript
// jest.config.js
projects: [
  {
    displayName: 'Unit Tests',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.ts'],
    testEnvironment: 'node',
  },
  {
    displayName: 'Integration Tests',
    testMatch: ['<rootDir>/src/**/__tests__/integration/**/*.spec.ts'],
    testTimeout: 60000, // 60 seconds
  },
  {
    displayName: 'Performance Tests',
    testMatch: ['<rootDir>/src/**/__tests__/performance/**/*.spec.ts'],
    testTimeout: 120000, // 2 minutes
  },
  // ... more projects
]
```

### Environment Variables

Tests use a separate environment file:

```bash
# .env.test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=test
DB_PASSWORD=test
DB_DATABASE=clubcorra_test
NODE_ENV=test
```

## Best Practices

### 1. Use Test Factories

Always use `TestDataFactory` methods to create test data:

```typescript
// ✅ Good
const user = TestDataFactory.createUser({ mobileNumber: '9876543210' });

// ❌ Bad
const user = {
  id: 'test-id',
  mobileNumber: '9876543210',
  // ... manually creating data
};
```

### 2. Clean Up Test Data

Always clean up test data to prevent test interference:

```typescript
beforeEach(async () => {
  await testSetup.clearAllTestData();
});

afterAll(async () => {
  await testSetup.cleanup();
});
```

### 3. Use Descriptive Test Names

Test names should clearly describe what is being tested:

```typescript
// ✅ Good
it('should reject earn request when user has insufficient balance', async () => {
  // test implementation
});

// ❌ Bad
it('should work', async () => {
  // test implementation
});
```

### 4. Test Error Cases

Always test both success and failure scenarios:

```typescript
describe('User Registration', () => {
  it('should register user successfully with valid data', async () => {
    // Test success case
  });

  it('should reject registration with invalid mobile number', async () => {
    // Test error case
  });

  it('should reject registration with duplicate email', async () => {
    // Test error case
  });
});
```

### 5. Use Performance Utilities

Use `PerformanceUtils` for performance testing:

```typescript
// ✅ Good
const { result, duration } = await PerformanceUtils.measurePerformance(
  async () => await repository.find(),
  'Database query'
);

// ❌ Bad
const startTime = Date.now();
const result = await repository.find();
const duration = Date.now() - startTime;
```

## Troubleshooting

### Common Issues

1. **Test Data Not Found**: Ensure test setup is called in `beforeEach`
2. **Database Connection Issues**: Check `.env.test` configuration
3. **Test Timeouts**: Increase timeout for integration/performance tests
4. **Memory Issues**: Use `--max-old-space-size=4096` for large performance tests

### Debug Mode

Run tests in debug mode for troubleshooting:

```bash
npm run test:debug
```

### Verbose Output

Enable verbose output for detailed test information:

```bash
npm run test -- --verbose
```

## Continuous Integration

### GitHub Actions

Tests are automatically run in CI/CD:

```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage
```

### Coverage Requirements

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Contributing

When adding new tests:

1. Use appropriate test type directory
2. Follow naming conventions
3. Use test factories for data creation
4. Add proper cleanup
5. Include both success and error cases
6. Add performance tests for new features
7. Add security tests for new endpoints

## Support

For testing infrastructure questions:

1. Check this documentation
2. Review existing test examples
3. Check test utilities source code
4. Create an issue for bugs or improvements
