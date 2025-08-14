console.log('Testing basic ts-node functionality...');

// Test basic import
import { NestFactory } from '@nestjs/core';
console.log('✅ NestJS import successful');

// Test config import
import { ConfigService } from '@nestjs/config';
console.log('✅ ConfigService import successful');

console.log('✅ All imports successful - ts-node is working');
