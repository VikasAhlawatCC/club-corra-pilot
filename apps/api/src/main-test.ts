// Test file to isolate the issue
console.log('Starting test...');

// Test basic import
import { NestFactory } from '@nestjs/core';
console.log('NestFactory imported successfully');

// Test other imports
import { ValidationPipe, Logger } from '@nestjs/common';
console.log('ValidationPipe and Logger imported successfully');

import { ConfigService } from '@nestjs/config';
console.log('ConfigService imported successfully');

// Test AppModule import
import { AppModule } from './app.module';
console.log('AppModule imported successfully');

// Test other imports
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
console.log('GlobalExceptionFilter imported successfully');

import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
console.log('RateLimitInterceptor imported successfully');

console.log('All imports successful');
