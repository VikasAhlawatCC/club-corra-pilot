import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { UserStatus } from '../../users/entities/user.entity';
import { hash } from 'bcrypt';

describe('Password Setup Flow Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dataSource.query('DELETE FROM users WHERE mobile_number LIKE \'%test%\'');
  });

  describe('POST /api/v1/auth/signup/setup-password', () => {
    it('should setup password and activate account immediately for verified mobile user', async () => {
      // Arrange - Create a test user with verified mobile but no password
      const testUser = {
        mobileNumber: '9876543210',
        email: null,
        status: UserStatus.PENDING,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: null,
      };

      const userRepository = dataSource.getRepository('users');
      const savedUser = await userRepository.save(testUser);

      const passwordSetupData = {
        mobileNumber: '9876543210',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        message: 'Password set successfully. Account activated.',
        userId: savedUser.id,
        requiresEmailVerification: false,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      });

      // Verify user status was updated in database
      const updatedUser = await userRepository.findOne({ where: { id: savedUser.id } });
      expect(updatedUser.status).toBe(UserStatus.ACTIVE);
      expect(updatedUser.passwordHash).toBeTruthy();
    });

    it('should setup password and activate account even when user has email', async () => {
      // Arrange - Create a test user with verified mobile, email, but no password
      const testUser = {
        mobileNumber: '9876543211',
        email: 'test@example.com',
        status: UserStatus.PENDING,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: null,
      };

      const userRepository = dataSource.getRepository('users');
      const savedUser = await userRepository.save(testUser);

      const passwordSetupData = {
        mobileNumber: '9876543211',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        message: 'Password set successfully. Account activated.',
        userId: savedUser.id,
        requiresEmailVerification: false,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      });

      // Verify user status was updated in database
      const updatedUser = await userRepository.findOne({ where: { id: savedUser.id } });
      expect(updatedUser.status).toBe(UserStatus.ACTIVE);
      expect(updatedUser.passwordHash).toBeTruthy();
    });

    it('should reject password setup for unverified mobile user', async () => {
      // Arrange - Create a test user with unverified mobile
      const testUser = {
        mobileNumber: '9876543212',
        email: null,
        status: UserStatus.PENDING,
        isMobileVerified: false,
        isEmailVerified: false,
        passwordHash: null,
      };

      await dataSource.getRepository('users').save(testUser);

      const passwordSetupData = {
        mobileNumber: '9876543212',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Mobile number must be verified before setting password');
        });
    });

    it('should reject password setup for user with existing password', async () => {
      // Arrange - Create a test user with existing password
      const hashedPassword = await hash('ExistingPassword123', 10);
      const testUser = {
        mobileNumber: '9876543213',
        email: null,
        status: UserStatus.PENDING,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: hashedPassword,
      };

      await dataSource.getRepository('users').save(testUser);

      const passwordSetupData = {
        mobileNumber: '9876543213',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid user state for password setup');
        });
    });

    it('should reject password setup for non-existent user', async () => {
      const passwordSetupData = {
        mobileNumber: '9999999999',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('User not found. Please complete OTP verification first.');
        });
    });

    it('should reject password setup with mismatched passwords', async () => {
      const passwordSetupData = {
        mobileNumber: '9876543210',
        password: 'TestPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Passwords do not match');
        });
    });

    it('should reject password setup with weak password', async () => {
      const passwordSetupData = {
        mobileNumber: '9876543210',
        password: 'weak',
        confirmPassword: 'weak',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Password does not meet strength requirements');
        });
    });
  });

  describe('POST /api/v1/auth/signup/add-email', () => {
    it('should allow adding email to active account', async () => {
      // Arrange - Create a test user with password and active status
      const hashedPassword = await hash('TestPassword123', 10);
      const testUser = {
        mobileNumber: '9876543214',
        email: null,
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: hashedPassword,
      };

      const userRepository = dataSource.getRepository('users');
      const savedUser = await userRepository.save(testUser);

      const emailData = {
        mobileNumber: '9876543214',
        email: 'test@example.com',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/add-email')
        .send(emailData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        message: 'Email added successfully. Please check your email for verification.',
        userId: savedUser.id,
        accountActivated: false,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
      });

      // Verify email was added to user
      const updatedUser = await userRepository.findOne({ where: { id: savedUser.id } });
      expect(updatedUser.email).toBe('test@example.com');
    });

    it('should reject adding email if already used by another user', async () => {
      // Arrange - Create two test users
      const hashedPassword = await hash('TestPassword123', 10);
      
      const user1 = {
        mobileNumber: '9876543215',
        email: null,
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: hashedPassword,
      };

      const user2 = {
        mobileNumber: '9876543216',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: hashedPassword,
      };

      await dataSource.getRepository('users').save([user1, user2]);

      const emailData = {
        mobileNumber: '9876543215',
        email: 'test@example.com',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup/add-email')
        .send(emailData)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('This email is already registered with another account');
        });
    });
  });

  describe('Complete Password Setup Flow', () => {
    it('should complete full flow: mobile verification -> password setup -> immediate activation', async () => {
      // This test simulates the complete flow that was fixed
      
      // Step 1: Create user with verified mobile (simulating OTP verification)
      const testUser = {
        mobileNumber: '9876543217',
        email: null,
        status: UserStatus.PENDING,
        isMobileVerified: true,
        isEmailVerified: false,
        passwordHash: null,
      };

      const userRepository = dataSource.getRepository('users');
      const savedUser = await userRepository.save(testUser);

      // Step 2: Setup password (should activate account immediately)
      const passwordSetupData = {
        mobileNumber: '9876543217',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123',
      };

      const passwordResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/setup-password')
        .send(passwordSetupData)
        .expect(201);

      // Verify account is activated
      expect(passwordResponse.body.requiresEmailVerification).toBe(false);
      expect(passwordResponse.body.accessToken).toBeTruthy();
      expect(passwordResponse.body.refreshToken).toBeTruthy();

      // Verify user status in database
      const activatedUser = await userRepository.findOne({ where: { id: savedUser.id } });
      expect(activatedUser.status).toBe(UserStatus.ACTIVE);
      expect(activatedUser.passwordHash).toBeTruthy();

      // Step 3: Optionally add email later (should work for active account)
      const emailData = {
        mobileNumber: '9876543217',
        email: 'test@example.com',
      };

      const emailResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup/add-email')
        .send(emailData)
        .expect(201);

      expect(emailResponse.body.message).toContain('Email added successfully');
      expect(emailResponse.body.accountActivated).toBe(false); // Account was already active
    });
  });
});
