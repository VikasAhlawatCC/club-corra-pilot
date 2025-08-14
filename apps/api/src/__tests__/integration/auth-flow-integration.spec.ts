import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User, UserStatus } from '../../users/entities/user.entity';
import { AuthProvider } from '../../users/entities/auth-provider.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { OTP } from '../../common/entities/otp.entity';
import { TestConfigModule, getTestDatabaseConfig } from '../../config/test.config';

describe('Authentication Flow Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: any;
  let testUserId: string;
  let testBrandId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: () => getTestDatabaseConfig(),
        }),
        AppModule,
      ],
      providers: [
        {
          provide: DataSource,
          useFactory: async () => {
            const config = getTestDatabaseConfig();
            const dataSource = new DataSource(config);
            await dataSource.initialize();
            return dataSource;
          },
        },
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

  describe('Complete Registration Flow', () => {
    it('should complete full registration flow: mobile → OTP → email → profile → password → home', async () => {
      // Step 1: Initiate signup with mobile number
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543210',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          authMethod: 'SMS',
        })
        .expect(201);

      expect(signupResponse.body.message).toContain('User created successfully');
      expect(signupResponse.body.requiresOtpVerification).toBe(true);
      expect(signupResponse.body.otpType).toBe('mobile');
      testUserId = signupResponse.body.userId;

      // Step 2: Verify mobile OTP
      const otpVerificationResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543210',
          code: '123456', // Mock OTP for testing
          type: 'SMS',
        })
        .expect(200);

      expect(otpVerificationResponse.body.user).toBeDefined();
      expect(otpVerificationResponse.body.tokens).toBeDefined();
      expect(otpVerificationResponse.body.user.isMobileVerified).toBe(true);

      const userToken = otpVerificationResponse.body.tokens.accessToken;

      // Step 3: Verify email with OTP
      const emailVerificationResponse = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'mock-email-verification-token',
        })
        .expect(200);

      expect(emailVerificationResponse.body.user.isEmailVerified).toBe(true);
      expect(emailVerificationResponse.body.requiresPasswordSetup).toBe(true);

      // Step 4: Setup password
      const passwordSetupResponse = await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUserId,
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
        })
        .expect(200);

      expect(passwordSetupResponse.body.success).toBe(true);
      expect(passwordSetupResponse.body.message).toContain('Password set successfully');

      // Step 5: Verify user can login with email and password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.isMobileVerified).toBe(true);
      expect(loginResponse.body.user.isEmailVerified).toBe(true);

      // Step 6: Verify welcome bonus was processed
      const balanceResponse = await request(app.getHttpServer())
        .get('/coins/balance')
        .set('Authorization', `Bearer ${loginResponse.body.tokens.accessToken}`)
        .expect(200);

      expect(balanceResponse.body.balance).toBe(100); // Welcome bonus
    });

    it('should handle OTP verification failures gracefully', async () => {
      // Initiate signup
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543211',
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      // Try to verify with invalid OTP
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543211',
          code: '000000', // Invalid OTP
          type: 'SMS',
        })
        .expect(400);

      // Try to verify with expired OTP (simulate)
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543211',
          code: 'expired',
          type: 'SMS',
        })
        .expect(400);
    });

    it('should handle email verification failures gracefully', async () => {
      // Complete signup and mobile verification first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543212',
          email: 'test3@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      const otpResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543212',
          code: '123456',
          type: 'SMS',
        })
        .expect(200);

      const userToken = otpResponse.body.tokens.accessToken;

      // Try to verify email with invalid token
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'invalid-token',
        })
        .expect(400);

      // Try to verify email with expired token
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'expired-token',
        })
        .expect(400);
    });

    it('should handle password setup validation errors', async () => {
      // Complete signup and verification first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543213',
          email: 'test4@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      const otpResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543213',
          code: '123456',
          type: 'SMS',
        })
        .expect(200);

      const userToken = otpResponse.body.tokens.accessToken;

      // Try to setup weak password
      await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: otpResponse.body.user.id,
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);

      // Try to setup password with mismatch
      await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: otpResponse.body.user.id,
          password: 'SecurePass123',
          confirmPassword: 'DifferentPass123',
        })
        .expect(400);
    });
  });

  describe('Login Flow Testing', () => {
    it('should handle mobile OTP login successfully', async () => {
      // Create verified user
      const user = await createVerifiedUser('9876543220', 'login@example.com');

      // Request login OTP
      const otpRequestResponse = await request(app.getHttpServer())
        .post('/auth/request-otp')
        .send({
          mobileNumber: '9876543220',
          type: 'SMS',
        })
        .expect(200);

      expect(otpRequestResponse.body.message).toContain('OTP sent successfully');

      // Login with OTP
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/mobile')
        .send({
          mobileNumber: '9876543220',
          otpCode: '123456',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.mobileNumber).toBe('9876543220');
    });

    it('should handle email password login successfully', async () => {
      // Create verified user with password
      const user = await createVerifiedUserWithPassword('9876543221', 'login2@example.com', 'SecurePass123');

      // Login with email and password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'login2@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.email).toBe('login2@example.com');
    });

    it('should handle login failures gracefully', async () => {
      // Try to login with non-existent mobile
      await request(app.getHttpServer())
        .post('/auth/login/mobile')
        .send({
          mobileNumber: '0000000000',
          otpCode: '123456',
        })
        .expect(401);

      // Try to login with invalid OTP
      await request(app.getHttpServer())
        .post('/auth/login/mobile')
        .send({
          mobileNumber: '9876543220',
          otpCode: '000000',
        })
        .expect(401);

      // Try to login with wrong password
      await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'login2@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);
    });
  });

  describe('OAuth Integration Testing', () => {
    it('should handle Google OAuth signup successfully', async () => {
      const oauthResponse = await request(app.getHttpServer())
        .post('/auth/oauth/signup')
        .send({
          provider: 'GOOGLE',
          code: 'mock-google-auth-code',
          redirectUri: 'clubcorra://auth/callback',
          mobileNumber: '9876543230',
        })
        .expect(200);

      expect(oauthResponse.body.user).toBeDefined();
      expect(oauthResponse.body.tokens).toBeDefined();
      expect(oauthResponse.body.user.isEmailVerified).toBe(true);
      expect(oauthResponse.body.user.authProviders).toContain('GOOGLE');
    });

    it('should handle Google OAuth login successfully', async () => {
      // Create user with Google OAuth
      const user = await createOAuthUser('9876543231', 'oauth@example.com', 'GOOGLE');

      // Login with OAuth
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/oauth')
        .send({
          provider: 'GOOGLE',
          code: 'mock-google-auth-code',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.email).toBe('oauth@example.com');
    });

    it('should handle OAuth failures gracefully', async () => {
      // Try to signup with invalid OAuth code
      await request(app.getHttpServer())
        .post('/auth/oauth/signup')
        .send({
          provider: 'GOOGLE',
          code: 'invalid-code',
          redirectUri: 'clubcorra://auth/callback',
        })
        .expect(400);

      // Try to login with invalid OAuth code
      await request(app.getHttpServer())
        .post('/auth/login/oauth')
        .send({
          provider: 'GOOGLE',
          code: 'invalid-code',
        })
        .expect(400);
    });
  });

  describe('Token Management Testing', () => {
    it('should refresh tokens successfully', async () => {
      // Create verified user
      const user = await createVerifiedUser('9876543240', 'token@example.com');

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'token@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body.tokens).toBeDefined();
      expect(refreshResponse.body.tokens.accessToken).not.toBe(loginResponse.body.tokens.accessToken);
    });

    it('should handle invalid refresh tokens gracefully', async () => {
      // Try to refresh with invalid token
      await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);
    });

    it('should handle logout successfully', async () => {
      // Create verified user
      const user = await createVerifiedUser('9876543250', 'logout@example.com');

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      const accessToken = loginResponse.body.tokens.accessToken;

      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.message).toContain('Logged out successfully');
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle duplicate mobile number registration', async () => {
      // Create first user
      await createVerifiedUser('9876543260', 'duplicate1@example.com');

      // Try to create second user with same mobile
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543260',
          email: 'duplicate2@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(409);
    });

    it('should handle duplicate email registration', async () => {
      // Create first user
      await createVerifiedUser('9876543270', 'duplicate3@example.com');

      // Try to create second user with same email
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543271',
          email: 'duplicate3@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(409);
    });

    it('should handle rate limiting for OTP requests', async () => {
      // Make multiple OTP requests rapidly
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/request-otp')
          .send({
            mobileNumber: '9876543280',
            type: 'SMS',
          });
      }

      // The last request should be rate limited
      await request(app.getHttpServer())
        .post('/auth/request-otp')
        .send({
          mobileNumber: '9876543280',
          type: 'SMS',
        })
        .expect(429);
    });

    it('should handle malformed request data', async () => {
      // Try to signup with invalid mobile number
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: 'invalid-mobile',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(400);

      // Try to signup with invalid email
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543290',
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(400);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test brand
    const brandRepository = dataSource.getRepository(Brand);
    const testBrand = brandRepository.create({
      name: 'Test Brand',
      description: 'Test brand for integration tests',
      earningPercentage: 30,
      redemptionPercentage: 100,
      brandwiseMaxCap: 2000,
      isActive: true,
    });
    const savedBrand = await brandRepository.save(testBrand);
    testBrandId = savedBrand.id;

    // Create global config for welcome bonus
    const configRepository = dataSource.getRepository(GlobalConfig);
    const welcomeBonusConfig = configRepository.create({
      key: 'welcome_bonus_amount',
      value: '100',
      type: 'number',
      description: 'Welcome bonus amount for new users',
      category: 'coins',
      isEditable: true,
    });
    await configRepository.save(welcomeBonusConfig);

    const minRedemptionConfig = configRepository.create({
      key: 'min_redemption_amount',
      value: '1',
      type: 'number',
      description: 'Minimum redemption amount',
      category: 'coins',
      isEditable: true,
    });
    await configRepository.save(minRedemptionConfig);

    const maxRedemptionConfig = configRepository.create({
      key: 'max_redemption_amount',
      value: '2000',
      type: 'number',
      description: 'Maximum redemption amount',
      category: 'coins',
      isEditable: true,
    });
    await configRepository.save(maxRedemptionConfig);
  }

  async function clearTestData() {
    const otpRepository = dataSource.getRepository(OTP);
    const userRepository = dataSource.getRepository(User);
    const balanceRepository = dataSource.getRepository(CoinBalance);
    const transactionRepository = dataSource.getRepository(CoinTransaction);
    const notificationRepository = dataSource.getRepository(Notification);
    const brandRepository = dataSource.getRepository(Brand);
    const configRepository = dataSource.getRepository(GlobalConfig);
    const authProviderRepository = dataSource.getRepository(AuthProvider);

    await otpRepository.clear();
    await balanceRepository.clear();
    await transactionRepository.clear();
    await notificationRepository.clear();
    await userRepository.clear();
    await brandRepository.clear();
    await configRepository.clear();
    await authProviderRepository.clear();
  }

  async function cleanupTestData() {
    await clearTestData();
  }

  async function createVerifiedUser(mobileNumber: string, email: string) {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
      mobileNumber,
      email,
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
    });
    return await userRepository.save(user);
  }

  async function createVerifiedUserWithPassword(mobileNumber: string, email: string, password: string) {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
      mobileNumber,
      email,
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
      passwordHash: await hashPassword(password),
    });
    return await userRepository.save(user);
  }

  async function createOAuthUser(mobileNumber: string, email: string, provider: string) {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
      mobileNumber,
      email,
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
    });
    
    const savedUser = await userRepository.save(user);
    
    // Create auth provider separately
    const authProviderRepository = dataSource.getRepository(AuthProvider);
    const authProvider = authProviderRepository.create({
      provider: provider as any, // Cast to ProviderType
      providerUserId: `test-${provider}-user`,
      email: email,
      userId: savedUser.id,
      isActive: true,
    });
    await authProviderRepository.save(authProvider);
    
    return savedUser;
  }

  async function hashPassword(password: string): Promise<string> {
    // Simple hash for testing - in production use bcrypt
    return Buffer.from(password).toString('base64');
  }
});
