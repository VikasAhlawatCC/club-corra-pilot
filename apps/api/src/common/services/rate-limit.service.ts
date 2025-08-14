import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  private readonly configs: Map<string, RateLimitConfig> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeRateLimitConfigs();
  }

  private initializeRateLimitConfigs() {
    // Public endpoints: 100 requests per minute per IP
    this.configs.set('public', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
    });

    // Authenticated endpoints: 1000 requests per minute per user
    this.configs.set('authenticated', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000,
    });

    // Admin endpoints: 500 requests per minute per admin
    this.configs.set('admin', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 500,
    });

    // File upload endpoints: 10 requests per minute per user
    this.configs.set('file_upload', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    });

    // WebSocket connections: 5 connections per minute per IP
    this.configs.set('websocket', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
    });
  }

  async checkRateLimit(
    key: string,
    type: 'public' | 'authenticated' | 'admin' | 'file_upload' | 'websocket' = 'authenticated',
  ): Promise<boolean> {
    const config = this.configs.get(type);
    if (!config) {
      this.logger.warn(`Unknown rate limit type: ${type}`);
      return true;
    }

    const now = Date.now();
    const record = this.rateLimits.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired, create new record
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      this.logger.warn(`Rate limit exceeded for key: ${key}, type: ${type}`);
      
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
            details: {
              type,
              maxRequests: config.maxRequests,
              windowMs: config.windowMs,
              remainingTime,
            },
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    record.count++;
    this.rateLimits.set(key, record);
    return true;
  }

  async checkPublicRateLimit(ip: string): Promise<boolean> {
    return this.checkRateLimit(`public:${ip}`, 'public');
  }

  async checkAuthenticatedRateLimit(userId: string): Promise<boolean> {
    return this.checkRateLimit(`authenticated:${userId}`, 'authenticated');
  }

  async checkAdminRateLimit(adminId: string): Promise<boolean> {
    return this.checkRateLimit(`admin:${adminId}`, 'admin');
  }

  async checkFileUploadRateLimit(userId: string): Promise<boolean> {
    return this.checkRateLimit(`file_upload:${userId}`, 'file_upload');
  }

  async checkWebSocketRateLimit(ip: string): Promise<boolean> {
    return this.checkRateLimit(`websocket:${ip}`, 'websocket');
  }

  // Clean up expired rate limit records
  cleanupExpiredRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.rateLimits.entries()) {
      if (now > record.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  // Get rate limit statistics
  getRateLimitStats(): {
    totalKeys: number;
    activeKeys: number;
    configs: Record<string, RateLimitConfig>;
  } {
    const now = Date.now();
    let activeKeys = 0;

    for (const record of this.rateLimits.values()) {
      if (now <= record.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.rateLimits.size,
      activeKeys,
      configs: Object.fromEntries(this.configs),
    };
  }

  // Reset rate limit for a specific key
  resetRateLimit(key: string): void {
    this.rateLimits.delete(key);
    this.logger.log(`Rate limit reset for key: ${key}`);
  }

  // Reset all rate limits
  resetAllRateLimits(): void {
    this.rateLimits.clear();
    this.logger.log('All rate limits reset');
  }
}
