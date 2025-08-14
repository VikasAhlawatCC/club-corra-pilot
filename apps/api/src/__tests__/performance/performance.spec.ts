import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { getTestSetup, clearGlobalTestSetup } from '../utils/test-setup';
import { TestDataFactory, PerformanceUtils } from '../utils/test-factories';

describe('Performance Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testSetup: any;

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
            entities: [User, Brand, CoinTransaction, CoinBalance, Notification, GlobalConfig],
            synchronize: true, // Only for testing
            logging: false,
            poolSize: 20, // Increase pool size for performance testing
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    testSetup = getTestSetup(dataSource);
  });

  afterAll(async () => {
    await testSetup.cleanup();
    await app.close();
    clearGlobalTestSetup();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await testSetup.clearAllTestData();
    // Setup fresh test data
    await testSetup.setupBasicTestData();
  });

  describe('Database Performance', () => {
    it('should handle large transaction queries efficiently', async () => {
      // Setup performance test data
      await testSetup.setupPerformanceTestData(10000);

      // Test query performance
      const { result: pendingTransactions, duration: queryTime } = await PerformanceUtils.measurePerformance(
        async () => {
          return await dataSource.getRepository(CoinTransaction)
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.user', 'user')
            .leftJoinAndSelect('transaction.brand', 'brand')
            .where('transaction.status = :status', { status: 'PENDING' })
            .orderBy('transaction.createdAt', 'DESC')
            .limit(100)
            .getMany();
        },
        'Large transaction query'
      );

      console.log(`Queried 100 pending transactions in ${queryTime}ms`);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(pendingTransactions).toHaveLength(100);
    });

    it('should handle complex aggregations efficiently', async () => {
      // Setup performance test data
      await testSetup.setupPerformanceTestData(5000);

      // Test complex aggregation queries
      const { result: brandStats, duration: aggregationTime } = await PerformanceUtils.measurePerformance(
        async () => {
          return await dataSource.getRepository(CoinTransaction)
            .createQueryBuilder('transaction')
            .select('brand.name', 'brandName')
            .addSelect('COUNT(*)', 'totalTransactions')
            .addSelect('SUM(CASE WHEN transaction.type = :earnType THEN transaction.coinsEarned ELSE 0 END)', 'totalCoinsEarned')
            .addSelect('SUM(CASE WHEN transaction.type = :redeemType THEN transaction.coinsRedeemed ELSE 0 END)', 'totalCoinsRedeemed')
            .addSelect('AVG(transaction.billAmount)', 'averageBillAmount')
            .leftJoin('transaction.brand', 'brand')
            .groupBy('brand.id, brand.name')
            .orderBy('totalTransactions', 'DESC')
            .getRawMany();
        },
        'Complex aggregation query'
      );

      console.log(`Complex aggregation query completed in ${aggregationTime}ms`);
      expect(aggregationTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(brandStats.length).toBeGreaterThan(0);
    });

    it('should handle concurrent database operations efficiently', async () => {
      const concurrentOperations = 100;

      // Simulate concurrent earn requests
      const operations = Array.from({ length: concurrentOperations }, (_, i) => {
        return async () => {
          return await dataSource.getRepository(CoinTransaction).save(
            TestDataFactory.createEarnTransaction({
              userId: `user-${i % 50}`,
              brandId: `brand-${i % 25}`,
              billAmount: 1000 + i * 10,
              coinsEarned: 300 + i * 3,
            })
          );
        };
      });

      const { totalDuration: totalTime } = await PerformanceUtils.measureConcurrentPerformance(
        operations,
        'Concurrent database operations'
      );

      console.log(`Completed ${concurrentOperations} concurrent operations in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all transactions were created
      const totalTransactions = await dataSource.getRepository(CoinTransaction).count();
      expect(totalTransactions).toBeGreaterThanOrEqual(concurrentOperations);
    });
  });

  describe('API Response Time Performance', () => {
    it('should respond to transaction queries within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/admin/transactions')
        .query({ page: 1, limit: 50 })
        .expect(200);

      const responseTime = Date.now() - startTime;

      console.log(`API response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.success).toBe(true);
    });

    it('should handle bulk operations efficiently', async () => {
      // Test bulk approval of transactions
      const pendingTransactions = await dataSource.getRepository(CoinTransaction)
        .find({ where: { status: 'PENDING' }, take: 100 });

      const startTime = Date.now();
      
      // Simulate bulk approval
      const updatePromises = pendingTransactions.map(tx => 
        dataSource.getRepository(CoinTransaction).update(tx.id, { 
          status: 'APPROVED',
          processedAt: new Date(),
        })
      );

      await Promise.all(updatePromises);
      const bulkUpdateTime = Date.now() - startTime;

      console.log(`Bulk updated ${pendingTransactions.length} transactions in ${bulkUpdateTime}ms`);
      expect(bulkUpdateTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should maintain performance under load', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();

      // Simulate concurrent API requests
      const requestPromises = Array.from({ length: concurrentRequests }, (_, i) => {
        return request(app.getHttpServer())
          .get('/admin/transactions')
          .query({ page: 1, limit: 20 })
          .expect(200);
      });

      const responses = await Promise.all(requestPromises);
      const totalTime = Date.now() - startTime;

      console.log(`Handled ${concurrentRequests} concurrent requests in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('WebSocket Performance', () => {
    it('should handle multiple WebSocket connections efficiently', async () => {
      // This test would require WebSocket testing setup
      // For now, we'll test the connection manager logic
      const maxConnections = 1000;
      const connectionManager = app.get('WebSocketConnectionManager');

      if (connectionManager) {
        const startTime = Date.now();
        
        // Simulate multiple connections
        for (let i = 0; i < maxConnections; i++) {
          connectionManager.addConnection(`user-${i}`, { id: `connection-${i}` });
        }

        const connectionTime = Date.now() - startTime;
        console.log(`Established ${maxConnections} connections in ${connectionTime}ms`);
        expect(connectionTime).toBeLessThan(5000); // Should complete within 5 seconds

        // Test broadcast performance
        const broadcastStartTime = Date.now();
        connectionManager.broadcastToAll('test_event', { message: 'Performance test' });
        const broadcastTime = Date.now() - broadcastStartTime;

        console.log(`Broadcast to ${maxConnections} connections in ${broadcastTime}ms`);
        expect(broadcastTime).toBeLessThan(1000); // Should complete within 1 second
      }
    });

    it('should handle real-time updates efficiently', async () => {
      // Test real-time balance updates
      const updateCount = 1000;
      const startTime = Date.now();

      // Simulate multiple balance updates
      for (let i = 0; i < updateCount; i++) {
        await dataSource.getRepository(CoinBalance).update(
          { userId: `user-${i % 100}` },
          { balance: 1000 + i * 10 }
        );
      }

      const updateTime = Date.now() - startTime;
      console.log(`Updated ${updateCount} balance records in ${updateTime}ms`);
      expect(updateTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain consistent memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', {
        rss: Math.round(initialMemory.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024) + 'MB',
      });

      // Perform intensive operations
      for (let i = 0; i < 10; i++) {
        await dataSource.getRepository(CoinTransaction)
          .createQueryBuilder('transaction')
          .leftJoinAndSelect('transaction.user', 'user')
          .leftJoinAndSelect('transaction.brand', 'brand')
          .where('transaction.status = :status', { status: 'PENDING' })
          .orderBy('transaction.createdAt', 'DESC')
          .limit(1000)
          .getMany();
      }

      const finalMemory = process.memoryUsage();
      console.log('Final memory usage:', {
        rss: Math.round(finalMemory.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024) + 'MB',
      });

      // Memory increase should be reasonable (less than 100MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    it('should handle connection pooling efficiently', async () => {
      const pool = dataSource.driver.pool;
      const initialPoolSize = pool.size;
      const initialIdleSize = pool.idle;

      console.log(`Initial pool size: ${initialPoolSize}, idle: ${initialIdleSize}`);

      // Perform multiple concurrent operations
      const concurrentOperations = 50;
      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.query('SELECT 1');
        await queryRunner.release();
      });

      await Promise.all(promises);

      const finalPoolSize = pool.size;
      const finalIdleSize = pool.idle;

      console.log(`Final pool size: ${finalPoolSize}, idle: ${finalIdleSize}`);

      // Pool should maintain reasonable size
      expect(finalPoolSize).toBeLessThanOrEqual(initialPoolSize * 2);
      expect(finalIdleSize).toBeGreaterThan(0);
    });
  });

  describe('Caching Performance', () => {
    it('should improve response times with caching', async () => {
      // First request (cache miss)
      const firstRequestStart = Date.now();
      await request(app.getHttpServer())
        .get('/admin/brands')
        .expect(200);
      const firstRequestTime = Date.now() - firstRequestStart;

      // Second request (cache hit)
      const secondRequestStart = Date.now();
      await request(app.getHttpServer())
        .get('/admin/brands')
        .expect(200);
      const secondRequestTime = Date.now() - secondRequestStart;

      console.log(`First request: ${firstRequestTime}ms, Second request: ${secondRequestTime}ms`);
      
      // Cached request should be faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
      expect(secondRequestTime).toBeLessThan(500); // Cached response should be very fast
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test users
    const users = Array.from({ length: 100 }, (_, i) => ({
      mobileNumber: `98765432${i.toString().padStart(2, '0')}`,
      email: `user${i}@example.com`,
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
    }));

    await dataSource.getRepository(User).save(users);

    // Create test brands
    const brands = Array.from({ length: 50 }, (_, i) => ({
      name: `Test Brand ${i}`,
      description: `Test brand ${i} description`,
      earningPercentage: 20 + (i % 30),
      redemptionPercentage: 80 + (i % 20),
                      brandwiseMaxCap: 1000 + i * 100,
      isActive: true,
    }));

    await dataSource.getRepository(Brand).save(brands);

    // Create test coin balances
    const balances = Array.from({ length: 100 }, (_, i) => ({
      userId: `user-${i}`,
      balance: 1000 + i * 10,
      totalEarned: 2000 + i * 20,
      totalRedeemed: 500 + i * 5,
    }));

    await dataSource.getRepository(CoinBalance).save(balances);

    // Create global configs
    const configs = [
      { key: 'minBillAmount', value: '100', category: 'transaction' },
      { key: 'maxBillAgeDays', value: '30', category: 'transaction' },
      { key: 'fraudPreventionHours', value: '24', category: 'transaction' },
    ];

    for (const config of configs) {
      const globalConfig = dataSource.getRepository(GlobalConfig).create(config);
      await dataSource.getRepository(GlobalConfig).save(globalConfig);
    }
  }

  async function clearTestData() {
    await dataSource.getRepository(CoinTransaction).clear();
    await dataSource.getRepository(CoinBalance).clear();
    await dataSource.getRepository(Notification).clear();
    await dataSource.getRepository(User).clear();
    await dataSource.getRepository(Brand).clear();
    await dataSource.getRepository(GlobalConfig).clear();
  }
});
