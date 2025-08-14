import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { OTP } from '../../common/entities/otp.entity';

describe('Backend-Mobile Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: any;

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
            entities: [User, Brand, CoinTransaction, CoinBalance, Notification, GlobalConfig, OTP],
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

  describe('Mobile App API Endpoints', () => {
    it('should handle mobile app authentication headers correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .set('X-Client-Type', 'mobile')
        .set('User-Agent', 'ClubCorra-Mobile/1.0.0')
        .send({
          mobileNumber: '9876543210',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      expect(response.body.message).toContain('User created successfully');
      expect(response.body.requiresOtpVerification).toBe(true);
    });

    it('should handle mobile app OTP verification correctly', async () => {
      // First create user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543211',
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      // Verify OTP
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543211',
          code: '123456', // Mock OTP for testing
          type: 'SMS',
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.tokens).toBeDefined();
      expect(response.body.user.isMobileVerified).toBe(true);
    });

    it('should handle mobile app email verification correctly', async () => {
      // Create and verify mobile first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
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
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543212',
          code: '123456',
          type: 'SMS',
        })
        .expect(200);

      const userToken = otpResponse.body.tokens.accessToken;

      // Verify email
      const emailResponse = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          token: 'mock-email-verification-token',
        })
        .expect(200);

      expect(emailResponse.body.user.isEmailVerified).toBe(true);
      expect(emailResponse.body.requiresPasswordSetup).toBe(true);
    });

    it('should handle mobile app password setup correctly', async () => {
      // Complete signup and verification first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
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
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543213',
          code: '123456',
          type: 'SMS',
        })
        .expect(200);

      const userToken = otpResponse.body.tokens.accessToken;

      const emailResponse = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          token: 'mock-email-verification-token',
        })
        .expect(200);

      // Setup password
      const passwordResponse = await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          userId: otpResponse.body.user.id,
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
        })
        .expect(200);

      expect(passwordResponse.body.success).toBe(true);
      expect(passwordResponse.body.message).toContain('Password set successfully');
    });

    it('should handle mobile app login with email and password correctly', async () => {
      // Create verified user with password
      const user = await createVerifiedUserWithPassword('9876543214', 'login@example.com', 'SecurePass123');

      // Login with email and password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .set('X-Platform', 'mobile')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.email).toBe('login@example.com');
      expect(loginResponse.body.user.isMobileVerified).toBe(true);
      expect(loginResponse.body.user.isEmailVerified).toBe(true);
    });

    it('should handle mobile app OAuth login correctly', async () => {
      // Create OAuth user
      const user = await createOAuthUser('9876543215', 'oauth@example.com', 'GOOGLE');

      // Login with OAuth
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/oauth')
        .set('X-Platform', 'mobile')
        .send({
          provider: 'GOOGLE',
          code: 'mock-google-auth-code',
        })
        .expect(200);

      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.tokens).toBeDefined();
      expect(loginResponse.body.user.email).toBe('oauth@example.com');
      expect(user.authProviders).toContain('GOOGLE');
    });

    it('should handle mobile app token refresh correctly', async () => {
      // Create verified user
      const user = await createVerifiedUser('9876543216', 'token@example.com');

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .set('X-Platform', 'mobile')
        .send({
          email: 'token@example.com',
          password: 'SecurePass123',
        })
        .expect(200);

      const refreshToken = loginResponse.body.tokens.refreshToken;

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('X-Platform', 'mobile')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body.tokens).toBeDefined();
      expect(refreshResponse.body.tokens.accessToken).not.toBe(loginResponse.body.tokens.accessToken);
    });

    it('should handle mobile app logout correctly', async () => {
      // Create verified user
      const user = await createVerifiedUser('9876543217', 'logout@example.com');

      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .set('X-Platform', 'mobile')
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
        .set('X-Platform', 'mobile')
        .expect(200);

      expect(logoutResponse.body.message).toContain('Logged out successfully');
    });
  });

  describe('Mobile App Error Handling', () => {
    it('should return proper error responses for mobile app', async () => {
      // Test invalid mobile number
      const invalidMobileResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: 'invalid-mobile',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(400);

      expect(invalidMobileResponse.body.error).toBeDefined();
      expect(invalidMobileResponse.body.error.code).toBe('VALIDATION_ERROR');

      // Test invalid email
      const invalidEmailResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543218',
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(400);

      expect(invalidEmailResponse.body.error).toBeDefined();
      expect(invalidEmailResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle mobile app rate limiting correctly', async () => {
      // Make multiple OTP requests rapidly
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/request-otp')
          .set('X-Platform', 'mobile')
          .send({
            mobileNumber: '9876543219',
            type: 'SMS',
          });
      }

      // The last request should be rate limited
      const rateLimitedResponse = await request(app.getHttpServer())
        .post('/auth/request-otp')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543219',
          type: 'SMS',
        })
        .expect(429);

      expect(rateLimitedResponse.body.error).toBeDefined();
      expect(rateLimitedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle mobile app authentication failures correctly', async () => {
      // Try to login with non-existent user
      const nonExistentResponse = await request(app.getHttpServer())
        .post('/auth/login/email')
        .set('X-Platform', 'mobile')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123',
        })
        .expect(401);

      expect(nonExistentResponse.body.error).toBeDefined();
      expect(nonExistentResponse.body.error.code).toBe('AUTHENTICATION_FAILED');

      // Try to access protected endpoint without token
      const noTokenResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('X-Platform', 'mobile')
        .expect(401);

      expect(noTokenResponse.body.error).toBeDefined();
      expect(noTokenResponse.body.error.code).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('Mobile App Data Validation', () => {
    it('should validate mobile app request data correctly', async () => {
      // Test missing required fields
      const missingFieldsResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543220',
          // Missing email, firstName, lastName
        })
        .expect(400);

      expect(missingFieldsResponse.body.error).toBeDefined();
      expect(missingFieldsResponse.body.error.code).toBe('VALIDATION_ERROR');

      // Test invalid data types
      const invalidTypesResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: 12345, // Should be string
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(400);

      expect(invalidTypesResponse.body.error).toBeDefined();
      expect(invalidTypesResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate mobile app password requirements correctly', async () => {
      // Create user first
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543221',
          email: 'test5@example.com',
          firstName: 'Test',
          lastName: 'User',
          authMethod: 'SMS',
        })
        .expect(201);

      const otpResponse = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .set('X-Platform', 'mobile')
        .send({
          mobileNumber: '9876543221',
          code: '123456',
          type: 'SMS',
        })
        .expect(200);

      const userToken = otpResponse.body.tokens.accessToken;

      const emailResponse = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          token: 'mock-email-verification-token',
        })
        .expect(200);

      // Test weak password
      const weakPasswordResponse = await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          userId: otpResponse.body.user.id,
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);

      expect(weakPasswordResponse.body.error).toBeDefined();
      expect(weakPasswordResponse.body.error.code).toBe('VALIDATION_ERROR');

      // Test password mismatch
      const passwordMismatchResponse = await request(app.getHttpServer())
        .post('/auth/setup-password')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Platform', 'mobile')
        .send({
          userId: otpResponse.body.user.id,
          password: 'SecurePass123',
          confirmPassword: 'DifferentPass123',
        })
        .expect(400);

      expect(passwordMismatchResponse.body.error).toBeDefined();
      expect(passwordMismatchResponse.body.error.code).toBe('VALIDATION_ERROR');
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
    await brandRepository.save(testBrand);

    // Create global config
    const configRepository = dataSource.getRepository(GlobalConfig);
    const globalConfig = configRepository.create({
      welcomeBonusAmount: 100,
      minRedemptionAmount: 1,
      maxRedemptionAmount: 2000,
      isActive: true,
    });
    await configRepository.save(globalConfig);
  }

  async function clearTestData() {
    const otpRepository = dataSource.getRepository(OTP);
    const userRepository = dataSource.getRepository(User);
    const balanceRepository = dataSource.getRepository(CoinBalance);
    const transactionRepository = dataSource.getRepository(CoinTransaction);
    const notificationRepository = dataSource.getRepository(Notification);
    const brandRepository = dataSource.getRepository(Brand);
    const configRepository = dataSource.getRepository(GlobalConfig);

    await otpRepository.clear();
    await balanceRepository.clear();
    await transactionRepository.clear();
    await notificationRepository.clear();
    await userRepository.clear();
    await brandRepository.clear();
    await configRepository.clear();
  }

  async function cleanupTestData() {
    await clearTestData();
  }

  async function createVerifiedUser(mobileNumber: string, email: string) {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
      mobileNumber,
      email,
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
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
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
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
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
      authProviders: [provider],
    });
    return await userRepository.save(user);
  }

  async function hashPassword(password: string): Promise<string> {
    // Simple hash for testing - in production use bcrypt
    return Buffer.from(password).toString('base64');
  }
});
