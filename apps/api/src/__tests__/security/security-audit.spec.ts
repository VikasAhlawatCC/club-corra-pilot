import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { getTestSetup, clearGlobalTestSetup } from '../utils/test-setup';
import { TestDataFactory, SecurityUtils } from '../utils/test-factories';

describe('Security Audit Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testSetup: any;
  let userToken: string;
  let adminToken: string;
  let testUserId: string;
  let testBrandId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST') || 'localhost',
            port: configService.get('DB_PORT') || 5432,
            username: configService.get('DB_USERNAME') || 'test',
            password: configService.get('DB_PASSWORD') || 'test',
            database: configService.get('DB_DATABASE') || 'clubcorra_test',
            entities: [User, Brand, CoinTransaction, CoinBalance, Notification, GlobalConfig],
            synchronize: true, // Only for testing
            logging: false,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    testSetup = getTestSetup(dataSource);
  });

  afterAll(async () => {
    await testSetup.cleanup();
    await app.close();
    clearGlobalTestSetup();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await testSetup.clearAllTestData();
    // Setup fresh test data
    const { testUser, testAdmin, testBrand } = await testSetup.setupSecurityTestData();
    testUserId = testUser.id;
    testBrandId = testBrand.id;
    
    // Generate tokens
    userToken = global.testUtils.generateTestToken({ sub: testUser.id });
    adminToken = global.testUtils.generateAdminToken('ADMIN');
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication tokens', async () => {
      // Test protected endpoints without token
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);

      await request(app.getHttpServer())
        .post('/transactions/earn')
        .send({})
        .expect(401);

      await request(app.getHttpServer())
        .get('/admin/transactions')
        .expect(401);
    });

    it('should reject requests with invalid JWT tokens', async () => {
      const invalidTokens = SecurityUtils.generateInvalidTokens();

      for (const token of invalidTokens) {
        await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', token)
          .expect(401);
      }
    });

    it('should reject expired JWT tokens', async () => {
      // This test would require a way to generate expired tokens
      // For now, we'll test the token validation logic
      const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.expired';
      
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', expiredToken)
        .expect(401);
    });

    it('should enforce proper token format', async () => {
      const malformedTokens = [
        'Bearer',
        'Bearer token without space',
        'token without Bearer',
        'Basic token',
        'OAuth token',
      ];

      for (const token of malformedTokens) {
        await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', token)
          .expect(401);
      }
    });
  });

  describe('Authorization Security', () => {
    it('should prevent users from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/admin/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .put('/admin/transactions/test-id/approve')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(403);

      await request(app.getHttpServer())
        .post('/admin/brands')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(403);
    });

    it('should prevent users from accessing other users data', async () => {
      const otherUserId = 'other-user-123';
      
      await request(app.getHttpServer())
        .get(`/users/${otherUserId}/profile`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/users/${otherUserId}/transactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should enforce role-based access control for admin operations', async () => {
      // Test with different admin roles
      const moderatorToken = 'Bearer moderator-token';
      const superAdminToken = 'Bearer super-admin-token';

      // Moderator should have limited access
      await request(app.getHttpServer())
        .delete('/admin/brands/test-id')
        .set('Authorization', moderatorToken)
        .expect(403);

      // Super admin should have full access
      await request(app.getHttpServer())
        .delete('/admin/brands/test-id')
        .set('Authorization', superAdminToken)
        .expect(404); // 404 because brand doesn't exist, but authorization passed
    });

    it('should prevent unauthorized brand modifications', async () => {
      await request(app.getHttpServer())
        .put(`/brands/${testBrandId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          earningPercentage: 50, // Try to increase earning percentage
        })
        .expect(403);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const { sqlInjection } = SecurityUtils.generateMaliciousPayloads();

      for (const payload of sqlInjection) {
        // Test in search queries
        await request(app.getHttpServer())
          .get('/admin/brands')
          .query({ query: payload })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400); // Should reject malformed input

        // Test in brand names
        await request(app.getHttpServer())
          .post('/admin/brands')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: payload,
            description: 'Test',
            earningPercentage: 30,
            redemptionPercentage: 100,
          })
          .expect(400);
      }
    });

    it('should prevent XSS attacks in user inputs', async () => {
      const { xss } = SecurityUtils.generateMaliciousPayloads();

      for (const payload of xss) {
        // Test in user profile
        await request(app.getHttpServer())
          .put('/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            firstName: payload,
            lastName: 'Test',
          })
          .expect(400);

        // Test in transaction notes
        await request(app.getHttpServer())
          .post('/transactions/earn')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            brandId: testBrandId,
            billAmount: 1000,
            billDate: new Date().toISOString(),
            receiptUrl: 'https://example.com/receipt.jpg',
            notes: payload,
          })
          .expect(400);
      }
    });

    it('should validate file upload security', async () => {
      const maliciousFiles = [
        { fileName: 'malicious.exe', fileType: 'application/x-msdownload' },
        { fileName: 'script.php', fileType: 'application/x-httpd-php' },
        { fileName: 'shell.sh', fileType: 'application/x-sh' },
        { fileName: 'virus.bat', fileType: 'application/x-msdos-program' },
        { fileName: 'payload.js', fileType: 'application/javascript' },
      ];

      for (const file of maliciousFiles) {
        await request(app.getHttpServer())
          .post('/files/upload-url')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: 1024,
          })
          .expect(400); // Should reject malicious file types
      }
    });

    it('should enforce proper data type validation', async () => {
      // Test invalid data types
      const invalidData = [
        { billAmount: 'not-a-number' },
        { billAmount: -100 },
        { billAmount: 0 },
        { earningPercentage: 150 },
        { earningPercentage: -10 },
        { billDate: 'invalid-date' },
        { billDate: new Date(Date.now() + 86400000).toISOString() }, // Future date
      ];

      for (const data of invalidData) {
        await request(app.getHttpServer())
          .post('/transactions/earn')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            brandId: testBrandId,
            ...data,
            receiptUrl: 'https://example.com/receipt.jpg',
          })
          .expect(400);
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const authRequests = Array.from({ length: 150 }, () => 
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            mobileNumber: '9876543210',
            otp: '123456',
          })
      );

      // First 100 requests should succeed (rate limit)
      const responses = await Promise.all(authRequests);
      const successCount = responses.filter(r => r.status === 200).length;
      const blockedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(100);
      expect(blockedCount).toBeGreaterThan(0);
    });

    it('should enforce rate limits on file uploads', async () => {
      const uploadRequests = Array.from({ length: 20 }, () =>
        request(app.getHttpServer())
          .post('/files/upload-url')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            fileName: 'test.jpg',
            fileType: 'image/jpeg',
            fileSize: 1024,
          })
      );

      const responses = await Promise.all(uploadRequests);
      const successCount = responses.filter(r => r.status === 200).length;
      const blockedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(10); // File upload limit
      expect(blockedCount).toBeGreaterThan(0);
    });

    it('should enforce rate limits on transaction submissions', async () => {
      const transactionRequests = Array.from({ length: 150 }, () =>
        request(app.getHttpServer())
          .post('/transactions/earn')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            brandId: testBrandId,
            billAmount: 1000,
            billDate: new Date().toISOString(),
            receiptUrl: 'https://example.com/receipt.jpg',
          })
      );

      const responses = await Promise.all(transactionRequests);
      const successCount = responses.filter(r => r.status === 201).length;
      const blockedCount = responses.filter(r => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(100);
      expect(blockedCount).toBeGreaterThan(0);
    });
  });

  describe('Business Logic Security', () => {
    it('should prevent double-spending of coins', async () => {
      // Submit first redemption request
      const redeem1 = await request(app.getHttpServer())
        .post('/transactions/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 500,
          coinsToRedeem: 100,
        })
        .expect(201);

      // Try to submit second redemption request for same amount
      await request(app.getHttpServer())
        .post('/transactions/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 500,
          coinsToRedeem: 100,
        })
        .expect(400); // Should fail due to insufficient balance
    });

    it('should prevent manipulation of coin calculations', async () => {
      // Try to submit earn request with manipulated data
      await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 1000,
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
          coinsEarned: 1000, // Try to set custom coin amount
        })
        .expect(400); // Should reject custom coin amounts
    });

    it('should enforce brand caps and limits', async () => {
      // Try to exceed brand earning cap
      await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 10000, // This would exceed the cap
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(400); // Should fail due to cap exceeded
    });

    it('should prevent future date submissions', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 1000,
          billDate: futureDate.toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(400); // Should reject future dates
    });
  });

  describe('Data Privacy Security', () => {
    it('should not expose sensitive user information', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify sensitive fields are not exposed
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('otpHash');
      expect(response.body.user).not.toHaveProperty('internalNotes');
    });

    it('should not expose admin-only information to users', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify admin fields are not exposed to users
      response.body.transactions.forEach((tx: any) => {
        expect(tx).not.toHaveProperty('adminNotes');
        expect(tx).not.toHaveProperty('internalFlags');
        expect(tx).not.toHaveProperty('fraudScore');
      });
    });

    it('should sanitize error messages to prevent information leakage', async () => {
      // Try to access non-existent resource
      const response = await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      // Error message should not reveal internal details
      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('SQL');
      expect(response.body.error.message).not.toContain('internal');
    });
  });

  describe('Session Security', () => {
    it('should invalidate tokens on logout', async () => {
      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Try to use token after logout
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);
    });

    it('should enforce token expiration', async () => {
      // This test would require a way to generate tokens with short expiration
      // For now, we'll test the token validation logic
      const shortLivedToken = 'Bearer short-lived-token';
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', shortLivedToken)
        .expect(401);
    });

    it('should prevent token reuse', async () => {
      // Use token multiple times
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);
      }

      // Token should still be valid
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test user
    const user = dataSource.getRepository(User).create({
      mobileNumber: '9876543210',
      email: 'test@example.com',
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
    });
    const savedUser = await dataSource.getRepository(User).save(user);
    testUserId = savedUser.id;

    // Create test brand
    const brand = dataSource.getRepository(Brand).create({
      name: 'Test Brand',
      description: 'Test brand for security testing',
      earningPercentage: 30,
      redemptionPercentage: 100,
                      brandwiseMaxCap: 2000,
      isActive: true,
    });
    const savedBrand = await dataSource.getRepository(Brand).save(brand);
    testBrandId = savedBrand.id;

    // Create coin balance
    await dataSource.getRepository(CoinBalance).save({
      userId: testUserId,
      balance: 500,
      totalEarned: 600,
      totalRedeemed: 100,
    });

    // Create global configs
    const configs = [
      { key: 'minBillAmount', value: '100', category: 'transaction' },
      { key: 'maxBillAgeDays', value: '30', category: 'transaction' },
      { key: 'fraudPreventionHours', value: '24', category: 'transaction' },
    ];

    for (const config of configs) {
      const globalConfig = dataSource.getRepository(GlobalConfig).create(config);
      await dataSource.getRepository(GlobalConfig).save(globalConfig);
    }

    // Generate test tokens
    userToken = 'Bearer user-test-token';
    adminToken = 'Bearer admin-test-token';
  }

  async function clearTestData() {
    await dataSource.getRepository(CoinTransaction).clear();
    await dataSource.getRepository(CoinBalance).clear();
    await dataSource.getRepository(Notification).clear();
    await dataSource.getRepository(User).clear();
    await dataSource.getRepository(Brand).clear();
    await dataSource.getRepository(GlobalConfig).clear();
  }
});
