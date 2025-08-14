import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { CommonModule } from '../../common/common.module';
import { User, UserStatus } from '../../users/entities/user.entity';
import { OTP, OTPType, OTPStatus } from '../../common/entities/otp.entity';
import { getTestDatabaseConfig } from '../../config/test.config';

describe('Authentication Flow Simple Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
              JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-testing-only',
              TWILIO_ACCOUNT_SID: 'test_account_sid',
              TWILIO_AUTH_TOKEN: 'test_auth_token',
              TWILIO_PHONE_NUMBER: '+1234567890',
              SMTP_HOST: 'localhost',
              SMTP_PORT: 587,
              SMTP_SECURE: false,
              SMTP_USER: 'test@example.com',
              SMTP_PASS: 'test_password',
              SMTP_FROM_EMAIL: 'test@example.com',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          ...getTestDatabaseConfig(),
          entities: [User, OTP],
        }),
        CommonModule,
        UsersModule,
        AuthModule,
        JwtModule.register({
          secret: 'test-jwt-secret-key-for-testing-only',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get('JwtService');

    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  beforeEach(async () => {
    // Clear test data
    if (dataSource && dataSource.isInitialized) {
      const otpRepository = dataSource.getRepository(OTP);
      const userRepository = dataSource.getRepository(User);
      
      // Clear in correct order to avoid foreign key constraints
      await otpRepository.clear();
      await userRepository.clear();
    }
  });

  describe('Basic Authentication Flow', () => {
    it('should create a test user successfully', async () => {
      // This is a basic test to verify the setup works
      const userRepository = dataSource.getRepository(User);
      
      const testUser = userRepository.create({
        mobileNumber: '9876543210',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: false,
        isEmailVerified: false,
      });

      const savedUser = await userRepository.save(testUser);
      
      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBeDefined();
      expect(savedUser.mobileNumber).toBe('9876543210');
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should handle OTP creation and verification', async () => {
      const otpRepository = dataSource.getRepository(OTP);
      const userRepository = dataSource.getRepository(User);
      
      // Create test user
      const testUser = userRepository.create({
        mobileNumber: '9876543211',
        email: 'test2@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: false,
        isEmailVerified: false,
      });
      
      const savedUser = await userRepository.save(testUser);
      
      // Create test OTP
      const testOtp = otpRepository.create({
        identifier: '9876543211',
        code: '123456',
        type: OTPType.SMS,
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      });
      
      const savedOtp = await otpRepository.save(testOtp);
      
      expect(savedOtp).toBeDefined();
      expect(savedOtp.code).toBe('123456');
      expect(savedOtp.identifier).toBe('9876543211');
    });

    it('should verify JWT service is working', () => {
      expect(jwtService).toBeDefined();
      
      const testPayload = { sub: 'test-user', email: 'test@example.com' };
      const token = jwtService.sign(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwtService.verify(token);
      expect(decoded.sub).toBe('test-user');
      expect(decoded.email).toBe('test@example.com');
    });
  });

  describe('API Endpoints', () => {
    it('should have health check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      
      expect(response.body).toBeDefined();
    });

    it('should have auth endpoints available', async () => {
      // Test that auth endpoints exist (even if they return errors due to missing data)
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          mobileNumber: '9876543212',
          email: 'test3@example.com',
          firstName: 'Test3',
          lastName: 'User3',
        })
        .expect(400); // Should fail validation, but endpoint exists
      
      expect(response.body).toBeDefined();
    });
  });
});
