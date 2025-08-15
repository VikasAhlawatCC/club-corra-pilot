import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Socket, io } from 'socket.io-client';
import { CoinsModule } from '../../coins/coins.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { BrandsModule } from '../../brands/brands.module';
import { WebSocketModule } from '../../websocket/websocket.module';
import { NotificationModule } from '../../notifications/notification.module';
import { CommonModule } from '../../common/common.module';
import { ConfigModule as AppConfigModule } from '../../config/config.module';
import { testConfig } from '../setup/test.config';
import { createTestUser, createTestBrand, createTestTransaction } from '../utils/test-factories';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';

describe('Phase 3: Complete Earn/Redeem Integration', () => {
  let app: INestApplication;
  let httpServer: any;
  let testUser: User;
  let testBrand: Brand;
  let testTransaction: CoinTransaction;
  let userSocket: Socket;
  let adminSocket: Socket;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [testConfig],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5432,
          username: process.env.TEST_DB_USERNAME || 'test',
          password: process.env.TEST_DB_PASSWORD || 'test',
          database: process.env.TEST_DB_NAME || 'club_corra_test',
          entities: [User, Brand, CoinTransaction, CoinBalance],
          synchronize: true, // Only for tests
          logging: false,
        }),
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
        UsersModule,
        BrandsModule,
        CoinsModule,
        WebSocketModule,
        NotificationModule,
        CommonModule,
        AppConfigModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    httpServer = app.getHttpServer();
    
    // Create test data
    testUser = await createTestUser(app);
    testBrand = await createTestBrand(app);
    
    // Get JWT token for authentication
    const authResponse = await app.getHttpAdapter().getInstance().inject({
      method: 'POST',
      url: '/api/v1/auth/login/mobile',
      payload: {
        mobileNumber: testUser.mobileNumber,
        otp: '123456', // Test OTP
      },
    });
    
    const authData = JSON.parse(authResponse.payload);
    jwtToken = authData.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (userSocket) {
      userSocket.disconnect();
    }
    if (adminSocket) {
      adminSocket.disconnect();
    }
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any existing transactions
    const transactionRepository = app.get('CoinTransactionRepository');
    await transactionRepository.clear();
    
    const balanceRepository = app.get('CoinBalanceRepository');
    await balanceRepository.clear();
  });

  describe('Complete Earn/Redeem Workflow', () => {
    it('should complete full earn workflow with real-time updates', async () => {
      // 1. User submits earn request
      const earnRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 1000,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        notes: 'Test earn request',
      };

      const earnResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/earn',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: earnRequest,
      });

      expect(earnResponse.statusCode).toBe(201);
      const earnData = JSON.parse(earnResponse.payload);
      expect(earnData.success).toBe(true);
      expect(earnData.transaction.type).toBe('EARN');
      expect(earnData.transaction.status).toBe('PENDING');

      // 2. Verify transaction was created
      const transactionRepository = app.get('CoinTransactionRepository');
      const createdTransaction = await transactionRepository.findOne({
        where: { id: earnData.transaction.id },
        relations: ['user', 'brand'],
      });

      expect(createdTransaction).toBeDefined();
      expect(createdTransaction.type).toBe('EARN');
      expect(createdTransaction.status).toBe('PENDING');
      expect(createdTransaction.billAmount).toBe(1000);

      // 3. Admin approves earn request
      const adminUser = await createTestUser(app, { isAdmin: true });
      const adminToken = await getAdminToken(app, adminUser);

      const approveResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'PUT',
        url: `/api/v1/admin/coins/transactions/${earnData.transaction.id}/approve`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          adminUserId: adminUser.id,
          adminNotes: 'Approved after receipt verification',
        },
      });

      expect(approveResponse.statusCode).toBe(200);
      const approveData = JSON.parse(approveResponse.payload);
      expect(approveData.success).toBe(true);

      // 4. Verify balance was updated
      const balanceRepository = app.get('CoinBalanceRepository');
      const userBalance = await balanceRepository.findOne({
        where: { userId: testUser.id },
      });

      expect(userBalance).toBeDefined();
      expect(userBalance.balance).toBeGreaterThan(0);
      expect(userBalance.totalEarned).toBeGreaterThan(0);
    });

    it('should complete full redeem workflow with real-time updates', async () => {
      // 1. First, ensure user has coins to redeem
      const balanceRepository = app.get('CoinBalanceRepository');
      await balanceRepository.save({
        userId: testUser.id,
        balance: 1000,
        totalEarned: 1000,
        totalRedeemed: 0,
      });

      // 2. User submits redeem request
      const redeemRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 500,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        coinsToRedeem: 200,
        notes: 'Test redeem request',
      };

      const redeemResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/redeem',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: redeemRequest,
      });

      expect(redeemResponse.statusCode).toBe(201);
      const redeemData = JSON.parse(redeemResponse.payload);
      expect(redeemData.success).toBe(true);
      expect(redeemData.transaction.type).toBe('REDEEM');
      expect(redeemData.transaction.status).toBe('PENDING');

      // 3. Admin approves redeem request
      const adminUser = await createTestUser(app, { isAdmin: true });
      const adminToken = await getAdminToken(app, adminUser);

      const approveResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'PUT',
        url: `/api/v1/admin/coins/transactions/${redeemData.transaction.id}/approve-redeem`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          adminUserId: adminUser.id,
          adminNotes: 'Approved redeem request',
        },
      });

      expect(approveResponse.statusCode).toBe(200);
      const approveData = JSON.parse(approveResponse.payload);
      expect(approveData.success).toBe(true);

      // 4. Admin processes payment
      const paymentResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'PUT',
        url: `/api/v1/admin/coins/transactions/${redeemData.transaction.id}/process-payment`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          adminUserId: adminUser.id,
          paymentTransactionId: 'TXN123456',
          paymentMethod: 'UPI',
          paymentAmount: 200,
          adminNotes: 'Payment processed via UPI',
        },
      });

      expect(paymentResponse.statusCode).toBe(200);
      const paymentData = JSON.parse(paymentResponse.payload);
      expect(paymentData.success).toBe(true);

      // 5. Verify final balance
      const finalBalance = await balanceRepository.findOne({
        where: { userId: testUser.id },
      });

      expect(finalBalance.balance).toBe(800); // 1000 - 200
      expect(finalBalance.totalRedeemed).toBe(200);
    });

    it('should handle real-time WebSocket updates', async () => {
      // 1. Connect user to WebSocket
      userSocket = io(`http://localhost:${httpServer.address().port}`, {
        auth: {
          token: jwtToken,
        },
      });

      const userConnected = await new Promise<boolean>((resolve) => {
        userSocket.on('connect', () => resolve(true));
        userSocket.on('connect_error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(userConnected).toBe(true);

      // 2. Submit earn request
      const earnRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 500,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        notes: 'Test real-time earn request',
      };

      const earnResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/earn',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: earnRequest,
      });

      expect(earnResponse.statusCode).toBe(201);

      // 3. Verify real-time balance update was sent
      const balanceUpdateReceived = await new Promise<boolean>((resolve) => {
        userSocket.on('balance_updated', (data) => {
          expect(data.event).toBe('balance_updated');
          expect(data.data.changeType).toBe('EARN');
          resolve(true);
        });
        setTimeout(() => resolve(false), 5000);
      });

      expect(balanceUpdateReceived).toBe(true);
    });

    it('should validate business rules correctly', async () => {
      // 1. Test minimum redemption amount
      const minRedeemRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 100,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        coinsToRedeem: 0, // Below minimum
        notes: 'Test minimum redemption',
      };

      const minRedeemResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/redeem',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: minRedeemRequest,
      });

      expect(minRedeemResponse.statusCode).toBe(400);

      // 2. Test maximum redemption amount
      const maxRedeemRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 10000,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        coinsToRedeem: 3000, // Above maximum
        notes: 'Test maximum redemption',
      };

      const maxRedeemResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/redeem',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: maxRedeemRequest,
      });

      expect(maxRedeemResponse.statusCode).toBe(400);

      // 3. Test insufficient balance
      const insufficientBalanceRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 1000,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        coinsToRedeem: 2000, // More than available balance
        notes: 'Test insufficient balance',
      };

      const insufficientBalanceResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/redeem',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: insufficientBalanceRequest,
      });

      expect(insufficientBalanceResponse.statusCode).toBe(400);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate transaction submissions', async () => {
      const earnRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 1000,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        notes: 'Test duplicate prevention',
      };

      // Submit first request
      const firstResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/earn',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: earnRequest,
      });

      expect(firstResponse.statusCode).toBe(201);

      // Submit duplicate request
      const duplicateResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/earn',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: earnRequest,
      });

      expect(duplicateResponse.statusCode).toBe(400);
    });

    it('should handle admin approval validation correctly', async () => {
      // 1. Create earn request
      const earnRequest = {
        userId: testUser.id,
        brandId: testBrand.id,
        billAmount: 1000,
        billDate: new Date().toISOString(),
        receiptUrl: 'https://example.com/receipt.jpg',
        notes: 'Test admin validation',
      };

      const earnResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'POST',
        url: '/api/v1/transactions/earn',
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: earnRequest,
      });

      expect(earnResponse.statusCode).toBe(201);
      const earnData = JSON.parse(earnResponse.payload);

      // 2. Try to approve with invalid admin user
      const invalidAdminResponse = await app.getHttpAdapter().getInstance().inject({
        method: 'PUT',
        url: `/api/v1/admin/coins/transactions/${earnData.transaction.id}/approve`,
        headers: {
          authorization: `Bearer ${jwtToken}`, // Regular user token
        },
        payload: {
          adminUserId: testUser.id,
          adminNotes: 'Invalid admin approval',
        },
      });

      expect(invalidAdminResponse.statusCode).toBe(403);
    });
  });
});

// Helper function to get admin token
async function getAdminToken(app: INestApplication, adminUser: User): Promise<string> {
  const authResponse = await app.getHttpAdapter().getInstance().inject({
    method: 'POST',
    url: '/api/v1/auth/login/mobile',
    payload: {
      mobileNumber: adminUser.mobileNumber,
      otp: '123456', // Test OTP
    },
  });
  
  const authData = JSON.parse(authResponse.payload);
  return authData.data.tokens.accessToken;
}
