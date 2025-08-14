import { ConfigModule } from '@nestjs/config';

/**
 * Test configuration for authentication flow testing
 * This provides a consistent test environment configuration
 */
export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
  load: [
    () => ({
      // Test database configuration
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'club_corra_user',
        password: process.env.DB_PASSWORD || 'club_corra_password',
        database: process.env.DB_DATABASE || 'clubcorra_test',
      },
      
      // Test JWT configuration
      jwt: {
        secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-for-testing-only',
        expiresIn: '1h',
        refreshExpiresIn: '7d',
      },
      
      // Test external services configuration
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || 'test_account_sid',
        authToken: process.env.TWILIO_AUTH_TOKEN || 'test_auth_token',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      },
      
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'test_password',
        fromEmail: process.env.SMTP_FROM_EMAIL || 'test@example.com',
      },
      
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
      
      // Test API configuration
      api: {
        port: parseInt(process.env.API_PORT || '3002', 10),
        host: process.env.API_HOST || 'localhost',
      },
    }),
  ],
});

/**
 * Test database configuration for TypeORM
 */
export const getTestDatabaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'club_corra_user',
  password: process.env.DB_PASSWORD || 'club_corra_password',
  database: process.env.DB_DATABASE || 'clubcorra_test',
  entities: ['src/**/*.entity.ts'],
  synchronize: true, // Only for testing
  logging: false,
  dropSchema: true, // Clean slate for each test run
});
