import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { getTestDatabaseConfig } from '../../config/test.config';

describe('Authentication Flow Comprehensive Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
          entities: ['src/**/*.entity.ts'],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clear test data - this will be handled by the dropSchema option in test config
  });

  describe('Basic API Health', () => {
    it('should have health check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should have auth signup endpoint available', async () => {
      const response = await request(app.getHttpServer())
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
        .expect(400); // Should fail validation, but endpoint exists
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should have auth login endpoint available', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          mobileNumber: '9876543210',
          password: 'testpassword',
        })
        .expect(400); // Should fail validation, but endpoint exists
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should have OTP verification endpoint available', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({
          mobileNumber: '9876543210',
          code: '123456',
          type: 'SMS',
        })
        .expect(400); // Should fail validation, but endpoint exists
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });
  });

  describe('User Management Endpoints', () => {
    it('should have users endpoint available', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(401); // Should require authentication, but endpoint exists
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Database Connectivity', () => {
    it('should have working database connection', () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should be able to query database', async () => {
      const queryRunner = dataSource.createQueryRunner();
      const result = await queryRunner.query('SELECT 1 as test');
      await queryRunner.release();
      
      expect(result).toBeDefined();
      expect(result[0].test).toBe(1);
    });
  });

  describe('JWT Service', () => {
    it('should have JWT service available', async () => {
      const jwtService = app.get('JwtService');
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

  describe('Error Handling', () => {
    it('should handle invalid endpoints gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/invalid-endpoint')
        .expect(404);
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toBeDefined();
    });
  });
});
