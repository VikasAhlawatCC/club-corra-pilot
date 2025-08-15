import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    }),
  );

  // CORS configuration
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    // Development environment - allow local network access
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^exp:\/\/192\.168\.\d+\.\d+:\d+$/,
    'exp://localhost:8081',
    'exp://127.0.0.1:8081',
    'exp+club-corra-pilot://expo-development-client',
    // Production domains (when deployed)
    'https://admin.clubcorra.com',
    'https://*.clubcorra.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || 
          origin.startsWith('exp://') || 
          origin.startsWith('exp+')) {
        return callback(null, true);
      }
      
      // Check regex patterns for local network access
      for (const pattern of allowedOrigins) {
        if (pattern instanceof RegExp && pattern.test(origin)) {
          return callback(null, true);
        }
      }
      
      // For development, allow all localhost and expo origins
      if (process.env.NODE_ENV === 'development' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('exp://'))) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Platform',
      'X-Client-Type',
      'User-Agent',
    ],
  });

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  const port = configService.get<number>('PORT') || 3001;
  const host = configService.get<string>('HOST') || '0.0.0.0';
  
  await app.listen(port, host);

  logger.log(`🚀 Application is running on: http://${host}:${port}`);
  logger.log(`🌐 Network accessible at: http://192.168.1.4:${port}`);
  logger.log(`📚 API Documentation available at: http://${host}:${port}/api/v1/docs`);
  logger.log(`🔍 Health check available at: http://${host}:${port}/api/v1/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
