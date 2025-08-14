import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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

describe('End-to-End Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: any;
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
    jwtService = moduleFixture.get('JwtService');

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await clearTestData();
    // Setup fresh test data
    await setupTestData();
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: signup → earn → redeem → admin approval → payment', async () => {
      // Step 1: User signup
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543210',
          email: 'test@example.com',
          otp: '123456',
          upiId: 'test@upi',
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        })
        .expect(201);

      expect(signupResponse.body.success).toBe(true);
      expect(signupResponse.body.user.coinBalance.balance).toBe(100); // Welcome bonus
      userToken = signupResponse.body.token;
      testUserId = signupResponse.body.user.id;

      // Step 2: Submit earn request
      const earnResponse = await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 1000,
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
          notes: 'Test earn request',
        })
        .expect(201);

      expect(earnResponse.body.success).toBe(true);
      expect(earnResponse.body.transaction.status).toBe('PENDING');
      expect(earnResponse.body.newBalance).toBe(400); // 100 + (1000 * 0.3)

      // Step 3: Admin approves earn request
      const approveEarnResponse = await request(app.getHttpServer())
        .put(`/admin/transactions/${earnResponse.body.transaction.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNotes: 'Approved test earn request',
        })
        .expect(200);

      expect(approveEarnResponse.body.success).toBe(true);
      expect(approveEarnResponse.body.transaction.status).toBe('APPROVED');

      // Step 4: Submit redemption request
      const redeemResponse = await request(app.getHttpServer())
        .post('/transactions/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 500,
          coinsToRedeem: 100,
          notes: 'Test redemption request',
        })
        .expect(201);

      expect(redeemResponse.body.success).toBe(true);
      expect(redeemResponse.body.transaction.status).toBe('PENDING');
      expect(redeemResponse.body.newBalance).toBe(300); // 400 - 100

      // Step 5: Admin approves redemption request
      const approveRedeemResponse = await request(app.getHttpServer())
        .put(`/admin/transactions/${redeemResponse.body.transaction.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNotes: 'Approved test redemption request',
        })
        .expect(200);

      expect(approveRedeemResponse.body.success).toBe(true);
      expect(approveRedeemResponse.body.transaction.status).toBe('APPROVED');

      // Step 6: Admin processes payment
      const paymentResponse = await request(app.getHttpServer())
        .put(`/admin/transactions/${redeemResponse.body.transaction.id}/process-payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: 'ADMIN_TX_12345',
          adminNotes: 'Payment processed via UPI',
        })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.transaction.status).toBe('PAID');
      expect(paymentResponse.body.transaction.transactionId).toBe('ADMIN_TX_12345');

      // Step 7: Verify final balance
      const balanceResponse = await request(app.getHttpServer())
        .get('/users/balance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(balanceResponse.body.balance).toBe(300);
      expect(balanceResponse.body.totalEarned).toBe(400);
      expect(balanceResponse.body.totalRedeemed).toBe(100);
    });

    it('should handle earn request rejection and rollback coins', async () => {
      // Submit earn request
      const earnResponse = await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 1000,
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      const initialBalance = earnResponse.body.newBalance;

      // Admin rejects the request
      const rejectResponse = await request(app.getHttpServer())
        .put(`/admin/transactions/${earnResponse.body.transaction.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Invalid receipt',
          adminNotes: 'Receipt is not clear',
        })
        .expect(200);

      expect(rejectResponse.body.success).toBe(true);
      expect(rejectResponse.body.transaction.status).toBe('REJECTED');

      // Verify coins are rolled back
      const balanceResponse = await request(app.getHttpServer())
        .get('/users/balance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(balanceResponse.body.balance).toBe(100); // Back to welcome bonus only
    });

    it('should enforce brand caps correctly', async () => {
      // Try to earn more than brand cap allows
      const earnResponse1 = await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 10000, // This would earn 3000 coins, exceeding cap
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt1.jpg',
        })
        .expect(400);

      expect(earnResponse1.body.error.message).toContain('Brand earning cap reached');
    });

    it('should prevent redemption without sufficient balance', async () => {
      // Try to redeem more than available balance
      const redeemResponse = await request(app.getHttpServer())
        .post('/transactions/redeem')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 500,
          coinsToRedeem: 500, // More than available balance
          notes: 'Test redemption request',
        })
        .expect(400);

      expect(redeemResponse.body.error.message).toContain('insufficient balance');
    });
  });

  describe('Real-time Features', () => {
    it('should send real-time notifications for status changes', async () => {
      // This test would require WebSocket testing setup
      // For now, we'll test the notification creation
      const earnResponse = await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: 1000,
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      // Check if notification was created
      const notificationsResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(notificationsResponse.body.notifications).toHaveLength(1);
      expect(notificationsResponse.body.notifications[0].type).toBe('TRANSACTION_STATUS');
    });
  });

  describe('Performance and Security', () => {
    it('should handle concurrent requests correctly', async () => {
      // Submit multiple earn requests simultaneously
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/transactions/earn')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            brandId: testBrandId,
            billAmount: 100 + i * 10,
            billDate: new Date().toISOString(),
            receiptUrl: `https://example.com/receipt${i}.jpg`,
          })
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify final balance is correct
      const balanceResponse = await request(app.getHttpServer())
        .get('/users/balance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Calculate expected balance: 100 (welcome) + sum of earned amounts
      const expectedBalance = 100 + responses.reduce((sum, _, i) => sum + (100 + i * 10) * 0.3, 0);
      expect(balanceResponse.body.balance).toBe(expectedBalance);
    });

    it('should validate input data correctly', async () => {
      // Test invalid bill amount
      await request(app.getHttpServer())
        .post('/transactions/earn')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: testBrandId,
          billAmount: -100, // Invalid negative amount
          billDate: new Date().toISOString(),
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(400);

      // Test future bill date
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
        .expect(400);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test brand
    const brand = dataSource.getRepository(Brand).create({
      name: 'Test Brand',
      description: 'Test brand for integration testing',
      earningPercentage: 30,
      redemptionPercentage: 100,
                      brandwiseMaxCap: 2000,
      isActive: true,
    });
    const savedBrand = await dataSource.getRepository(Brand).save(brand);
    testBrandId = savedBrand.id;

    // Create test admin user and token
    adminToken = jwtService.sign({
      sub: 'admin-123',
      role: 'ADMIN',
      email: 'admin@clubcorra.com',
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
  }

  async function clearTestData() {
    await dataSource.getRepository(CoinTransaction).clear();
    await dataSource.getRepository(CoinBalance).clear();
    await dataSource.getRepository(Notification).clear();
    await dataSource.getRepository(User).clear();
  }

  async function cleanupTestData() {
    await dataSource.getRepository(CoinTransaction).clear();
    await dataSource.getRepository(CoinBalance).clear();
    await dataSource.getRepository(Notification).clear();
    await dataSource.getRepository(User).clear();
    await dataSource.getRepository(Brand).clear();
    await dataSource.getRepository(GlobalConfig).clear();
  }
});
