import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RateLimitService } from '../common/services/rate-limit.service';
import { ConnectionManager } from '../websocket/connection.manager';

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  responseTime: number;
  details?: any;
}

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly rateLimitService: RateLimitService,
    private readonly connectionManager: ConnectionManager,
  ) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    const checks: HealthCheck[] = [];
    
    // Basic health check
    checks.push(await this.checkBasicHealth());
    
    // Database health check
    checks.push(await this.checkDatabaseHealth());
    
    // Rate limiting health check
    checks.push(await this.checkRateLimitHealth());
    
    // WebSocket health check
    checks.push(await this.checkWebSocketHealth());
    
    // Configuration health check
    checks.push(await this.checkConfigurationHealth());

    // Calculate summary
    const passed = checks.filter(check => check.status === 'ok').length;
    const failed = checks.filter(check => check.status === 'error').length;
    const overallStatus = failed === 0 ? 'ok' : 'error';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      checks,
      summary: {
        total: checks.length,
        passed,
        failed,
      },
    };
  }

  @Get('detailed')
  async getDetailedHealth(): Promise<HealthResponse> {
    const checks: HealthCheck[] = [];
    
    // All basic checks
    checks.push(await this.checkBasicHealth());
    checks.push(await this.checkDatabaseHealth());
    checks.push(await this.checkRateLimitHealth());
    checks.push(await this.checkWebSocketHealth());
    checks.push(await this.checkConfigurationHealth());
    
    // Additional detailed checks
    checks.push(await this.checkDatabaseConnections());
    checks.push(await this.checkRateLimitStats());
    checks.push(await this.checkWebSocketStats());
    checks.push(await this.checkEnvironmentVariables());

    // Calculate summary
    const passed = checks.filter(check => check.status === 'ok').length;
    const failed = checks.filter(check => check.status === 'error').length;
    const overallStatus = failed === 0 ? 'ok' : 'error';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      checks,
      summary: {
        total: checks.length,
        passed,
        failed,
      },
    };
  }

  private async checkBasicHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      return {
        name: 'Basic Health',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          message: 'Application is running',
          memory: process.memoryUsage(),
        },
      };
    } catch (error) {
      return {
        name: 'Basic Health',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const isConnected = this.dataSource.isInitialized;
      
      if (!isConnected) {
        throw new Error('Database not connected');
      }

      // Test a simple query
      await this.dataSource.query('SELECT 1');

      return {
        name: 'Database',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          type: this.dataSource.options.type,
          database: this.dataSource.options.database,
        },
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkRateLimitHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const stats = this.rateLimitService.getRateLimitStats();
      
      return {
        name: 'Rate Limiting',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          totalKeys: stats.totalKeys,
          activeKeys: stats.activeKeys,
          configs: Object.keys(stats.configs).length,
        },
      };
    } catch (error) {
      return {
        name: 'Rate Limiting',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkWebSocketHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const stats = this.connectionManager.getAllConnections();
      
      return {
        name: 'WebSocket',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          connectedClients: this.connectionManager.getConnectedUsersCount() + this.connectionManager.getConnectedAdminsCount(),
          connectedUsers: stats.users.length,
        },
      };
    } catch (error) {
      return {
        name: 'WebSocket',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkConfigurationHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const requiredEnvVars = [
        'JWT_SECRET',
        'DATABASE_URL',
        'S3_BUCKET',
        'S3_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ];

      const missingVars = requiredEnvVars.filter(varName => !this.configService.get(varName));
      
      if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
      }

      return {
        name: 'Configuration',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          environment: this.configService.get('NODE_ENV'),
          nodeEnv: process.env.NODE_ENV,
          port: this.configService.get('PORT'),
        },
      };
    } catch (error) {
      return {
        name: 'Configuration',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkDatabaseConnections(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const connectionCount = await queryRunner.query(
        "SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database()"
      );
      await queryRunner.release();

      return {
        name: 'Database Connections',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          activeConnections: connectionCount[0]?.connections || 0,
        },
      };
    } catch (error) {
      return {
        name: 'Database Connections',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkRateLimitStats(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const stats = this.rateLimitService.getRateLimitStats();
      
      return {
        name: 'Rate Limit Statistics',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          totalKeys: stats.totalKeys,
          activeKeys: stats.activeKeys,
          configTypes: Object.keys(stats.configs),
        },
      };
    } catch (error) {
      return {
        name: 'Rate Limit Statistics',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkWebSocketStats(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const stats = this.connectionManager.getAllConnections();
      
      return {
        name: 'WebSocket Statistics',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          connectedClients: this.connectionManager.getConnectedUsersCount() + this.connectionManager.getConnectedAdminsCount(),
          connectedUsers: stats.users,
          userCount: stats.users.length,
        },
      };
    } catch (error) {
      return {
        name: 'WebSocket Statistics',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  private async checkEnvironmentVariables(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined,
        JWT_SECRET: process.env.JWT_SECRET ? '***' : undefined,
        S3_BUCKET: process.env.S3_BUCKET,
        S3_REGION: process.env.S3_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '***' : undefined,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '***' : undefined,
        CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      };

      return {
        name: 'Environment Variables',
        status: 'ok',
        responseTime: Date.now() - startTime,
        details: {
          variables: Object.keys(envVars).filter(key => envVars[key] !== undefined),
          total: Object.keys(envVars).length,
          set: Object.keys(envVars).filter(key => envVars[key] !== undefined).length,
        },
      };
    } catch (error) {
      return {
        name: 'Environment Variables',
        status: 'error',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
        },
      };
    }
  }
}
