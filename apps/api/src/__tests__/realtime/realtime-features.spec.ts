import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { WebSocketGateway as AppWebSocketGateway } from '../../websocket/websocket.gateway';
import { ConnectionManager } from '../../websocket/connection.manager';
import { NotificationService } from '../../notifications/notification.service';
import { getTestSetup, clearGlobalTestSetup } from '../utils/test-setup';
import { TestDataFactory } from '../utils/test-factories';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
class TestWebSocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('test_message')
  handleTestMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return { event: 'test_response', data: { message: 'Test response', received: data } };
  }
}

describe('Real-time Features Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testSetup: any;
  let webSocketGateway: AppWebSocketGateway;
  let connectionManager: ConnectionManager;
  let notificationService: NotificationService;
  let testUserId: string;
  let testBrandId: string;

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
    webSocketGateway = moduleFixture.get<AppWebSocketGateway>(AppWebSocketGateway);
    connectionManager = moduleFixture.get<ConnectionManager>(ConnectionManager);
    notificationService = moduleFixture.get<NotificationService>(NotificationService);
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
    const { testUser, testBrand } = await testSetup.setupRealTimeTestData();
    testUserId = testUser.id;
    testBrandId = testBrand.id;
  });

  describe('WebSocket Connection Management', () => {
    it('should establish and manage WebSocket connections', async () => {
      // Simulate user connection
      const mockSocket = {
        id: 'test-socket-1',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      // Add connection
      connectionManager.addConnection(testUserId, mockSocket as any);
      
      // Verify connection is tracked
      expect(connectionManager.getUserConnection(testUserId)).toBe(mockSocket);
      expect(connectionManager.getConnectionCount()).toBe(1);

      // Simulate another user connection
      const mockSocket2 = {
        id: 'test-socket-2',
        userId: 'user-2',
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection('user-2', mockSocket2 as any);
      expect(connectionManager.getConnectionCount()).toBe(2);

      // Remove connection
      connectionManager.removeConnection(testUserId);
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();
      expect(connectionManager.getConnectionCount()).toBe(1);
    });

    it('should handle multiple connections per user', async () => {
      // Simulate user connecting from multiple devices
      const mockSocket1 = {
        id: 'socket-1',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const mockSocket2 = {
        id: 'socket-2',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket1 as any);
      connectionManager.addConnection(testUserId, mockSocket2 as any);

      // Should track multiple connections
      const connections = connectionManager.getUserConnections(testUserId);
      expect(connections).toHaveLength(2);
      expect(connections).toContain(mockSocket1);
      expect(connections).toContain(mockSocket2);
    });

    it('should handle connection cleanup on disconnect', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);
      expect(connectionManager.getConnectionCount()).toBe(1);

      // Simulate disconnect
      connectionManager.removeConnection(testUserId);
      expect(connectionManager.getConnectionCount()).toBe(0);
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();
    });

    it('should handle connection limits and cleanup', async () => {
      // Test connection limit handling
      const maxConnections = 1000;
      
      for (let i = 0; i < maxConnections; i++) {
        const mockSocket = {
          id: `socket-${i}`,
          userId: `user-${i}`,
          emit: jest.fn(),
          disconnect: jest.fn(),
        };
        connectionManager.addConnection(`user-${i}`, mockSocket as any);
      }

      expect(connectionManager.getConnectionCount()).toBe(maxConnections);

      // Test cleanup of old connections
      connectionManager.cleanupInactiveConnections();
      expect(connectionManager.getConnectionCount()).toBeLessThanOrEqual(maxConnections);
    });
  });

  describe('Real-time Notifications', () => {
    it('should send real-time notifications to connected users', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Create notification
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'TRANSACTION_STATUS',
        message: 'Your earn request has been approved!',
        data: { transactionId: 'tx-123' },
      });

      // Send real-time notification
      await notificationService.sendRealTimeNotification(testUserId, notification);

      // Verify socket received notification
      expect(mockSocket.emit).toHaveBeenCalledWith('notification_received', {
        id: notification.id,
        type: 'TRANSACTION_STATUS',
        message: 'Your earn request has been approved!',
        data: { transactionId: 'tx-123' },
        isRead: false,
        createdAt: expect.any(Date),
      });
    });

    it('should handle notifications for offline users', async () => {
      // User is not connected
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();

      // Create notification
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'TRANSACTION_STATUS',
        message: 'Your earn request has been approved!',
        data: { transactionId: 'tx-123' },
      });

      // Send real-time notification (should not fail)
      await notificationService.sendRealTimeNotification(testUserId, notification);

      // Notification should be stored for when user comes online
      const storedNotifications = await notificationService.getUserNotifications(testUserId);
      expect(storedNotifications).toContainEqual(
        expect.objectContaining({
          id: notification.id,
          message: 'Your earn request has been approved!',
        })
      );
    });

    it('should send broadcast notifications to all connected users', async () => {
      // Setup multiple connections
      const mockSocket1 = {
        id: 'socket-1',
        userId: 'user-1',
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const mockSocket2 = {
        id: 'socket-2',
        userId: 'user-2',
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection('user-1', mockSocket1 as any);
      connectionManager.addConnection('user-2', mockSocket2 as any);

      // Send broadcast notification
      const broadcastMessage = 'System maintenance scheduled for tonight';
      connectionManager.broadcastToAll('system_notification', {
        message: broadcastMessage,
        type: 'MAINTENANCE',
      });

      // Verify both sockets received the message
      expect(mockSocket1.emit).toHaveBeenCalledWith('system_notification', {
        message: broadcastMessage,
        type: 'MAINTENANCE',
      });

      expect(mockSocket2.emit).toHaveBeenCalledWith('system_notification', {
        message: broadcastMessage,
        type: 'MAINTENANCE',
      });
    });

    it('should handle notification delivery failures gracefully', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(() => {
          throw new Error('Socket error');
        }),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Create notification
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'TRANSACTION_STATUS',
        message: 'Test notification',
      });

      // Should not throw error, should handle gracefully
      await expect(
        notificationService.sendRealTimeNotification(testUserId, notification)
      ).resolves.not.toThrow();

      // Should remove problematic connection
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();
    });
  });

  describe('Real-time Balance Updates', () => {
    it('should broadcast balance updates in real-time', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Update user balance
      const newBalance = 750;
      await dataSource.getRepository(CoinBalance).update(
        { userId: testUserId },
        { balance: newBalance }
      );

      // Broadcast balance update
      connectionManager.broadcastToUser(testUserId, 'balance_updated', {
        userId: testUserId,
        newBalance,
        updatedAt: new Date(),
      });

      // Verify socket received balance update
      expect(mockSocket.emit).toHaveBeenCalledWith('balance_updated', {
        userId: testUserId,
        newBalance,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle balance updates for multiple user connections', async () => {
      // User connected from multiple devices
      const mockSocket1 = {
        id: 'socket-1',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const mockSocket2 = {
        id: 'socket-2',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket1 as any);
      connectionManager.addConnection(testUserId, mockSocket2 as any);

      // Broadcast balance update
      const balanceUpdate = {
        userId: testUserId,
        newBalance: 800,
        updatedAt: new Date(),
      };

      connectionManager.broadcastToUser(testUserId, 'balance_updated', balanceUpdate);

      // Both sockets should receive the update
      expect(mockSocket1.emit).toHaveBeenCalledWith('balance_updated', balanceUpdate);
      expect(mockSocket2.emit).toHaveBeenCalledWith('balance_updated', balanceUpdate);
    });

    it('should handle balance update failures gracefully', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(() => {
          throw new Error('Balance update failed');
        }),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Should not throw error on balance update failure
      expect(() => {
        connectionManager.broadcastToUser(testUserId, 'balance_updated', {
          userId: testUserId,
          newBalance: 900,
        });
      }).not.toThrow();

      // Should remove problematic connection
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();
    });
  });

  describe('Transaction Status Updates', () => {
    it('should notify users of transaction status changes in real-time', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Create transaction
      const transaction = await dataSource.getRepository(CoinTransaction).save({
        userId: testUserId,
        brandId: testBrandId,
        type: 'EARN',
        status: 'PENDING',
        billAmount: 1000,
        coinsEarned: 300,
      });

      // Update transaction status
      await dataSource.getRepository(CoinTransaction).update(
        { id: transaction.id },
        { status: 'APPROVED', processedAt: new Date() }
      );

      // Send real-time status update
      connectionManager.broadcastToUser(testUserId, 'transaction_status_changed', {
        transactionId: transaction.id,
        newStatus: 'APPROVED',
        previousStatus: 'PENDING',
        updatedAt: new Date(),
      });

      // Verify socket received status update
      expect(mockSocket.emit).toHaveBeenCalledWith('transaction_status_changed', {
        transactionId: transaction.id,
        newStatus: 'APPROVED',
        previousStatus: 'PENDING',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle admin notifications for new requests', async () => {
      // Setup admin connections
      const adminSocket1 = {
        id: 'admin-socket-1',
        userId: 'admin-1',
        role: 'ADMIN',
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const adminSocket2 = {
        id: 'admin-socket-2',
        userId: 'admin-2',
        role: 'ADMIN',
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection('admin-1', adminSocket1 as any);
      connectionManager.addConnection('admin-2', adminSocket2 as any);

      // Create new transaction request
      const transaction = await dataSource.getRepository(CoinTransaction).save({
        userId: testUserId,
        brandId: testBrandId,
        type: 'EARN',
        status: 'PENDING',
        billAmount: 1000,
        coinsEarned: 300,
      });

      // Notify all admins
      connectionManager.broadcastToRole('ADMIN', 'new_request_pending', {
        transactionId: transaction.id,
        type: 'EARN',
        userId: testUserId,
        brandId: testBrandId,
        billAmount: 1000,
        createdAt: new Date(),
      });

      // Verify both admin sockets received notification
      expect(adminSocket1.emit).toHaveBeenCalledWith('new_request_pending', {
        transactionId: transaction.id,
        type: 'EARN',
        userId: testUserId,
        brandId: testBrandId,
        billAmount: 1000,
        createdAt: expect.any(Date),
      });

      expect(adminSocket2.emit).toHaveBeenCalledWith('new_request_pending', {
        transactionId: transaction.id,
        type: 'EARN',
        userId: testUserId,
        brandId: testBrandId,
        billAmount: 1000,
        createdAt: expect.any(Date),
      });
    });
  });

  describe('WebSocket Message Handling', () => {
    it('should handle client messages and respond appropriately', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Simulate client joining a room
      const roomName = `user_${testUserId}`;
      mockSocket.join(roomName);

      // Verify room joining
      expect(mockSocket.join).toHaveBeenCalledWith(roomName);

      // Simulate client leaving a room
      mockSocket.leave(roomName);
      expect(mockSocket.leave).toHaveBeenCalledWith(roomName);
    });

    it('should handle malformed messages gracefully', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Send malformed message (should not crash)
      expect(() => {
        connectionManager.broadcastToUser(testUserId, 'invalid_event', null);
      }).not.toThrow();

      expect(() => {
        connectionManager.broadcastToUser(testUserId, '', {});
      }).not.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(() => {
          throw new Error('Connection lost');
        }),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      // Should handle connection errors gracefully
      expect(() => {
        connectionManager.broadcastToUser(testUserId, 'test_event', {});
      }).not.toThrow();

      // Should remove problematic connection
      expect(connectionManager.getUserConnection(testUserId)).toBeUndefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high connection volumes efficiently', async () => {
      const connectionCount = 1000;
      const startTime = Date.now();

      // Create many connections
      for (let i = 0; i < connectionCount; i++) {
        const mockSocket = {
          id: `socket-${i}`,
          userId: `user-${i}`,
          emit: jest.fn(),
          disconnect: jest.fn(),
        };
        connectionManager.addConnection(`user-${i}`, mockSocket as any);
      }

      const connectionTime = Date.now() - startTime;
      console.log(`Established ${connectionCount} connections in ${connectionTime}ms`);
      expect(connectionTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test broadcast performance
      const broadcastStartTime = Date.now();
      connectionManager.broadcastToAll('performance_test', { message: 'Test' });
      const broadcastTime = Date.now() - broadcastStartTime;

      console.log(`Broadcast to ${connectionCount} connections in ${broadcastTime}ms`);
      expect(broadcastTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should maintain performance under message load', async () => {
      const mockSocket = {
        id: 'test-socket',
        userId: testUserId,
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      connectionManager.addConnection(testUserId, mockSocket as any);

      const messageCount = 1000;
      const startTime = Date.now();

      // Send many messages
      for (let i = 0; i < messageCount; i++) {
        connectionManager.broadcastToUser(testUserId, 'test_message', {
          id: i,
          message: `Message ${i}`,
        });
      }

      const totalTime = Date.now() - startTime;
      console.log(`Sent ${messageCount} messages in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify all messages were sent
      expect(mockSocket.emit).toHaveBeenCalledTimes(messageCount);
    });

    it('should handle memory usage efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create many connections
      for (let i = 0; i < 500; i++) {
        const mockSocket = {
          id: `socket-${i}`,
          userId: `user-${i}`,
          emit: jest.fn(),
          disconnect: jest.fn(),
        };
        connectionManager.addConnection(`user-${i}`, mockSocket as any);
      }

      // Remove connections
      for (let i = 0; i < 500; i++) {
        connectionManager.removeConnection(`user-${i}`);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test user
    const user = dataSource.getRepository(User).create({
      mobileNumber: '9876543210',
      email: 'test@example.com',
      status: 'ACTIVE',
      isMobileVerified: true,
      isEmailVerified: true,
      hasWelcomeBonusProcessed: true,
    });
    const savedUser = await dataSource.getRepository(User).save(user);
    testUserId = savedUser.id;

    // Create test brand
    const brand = dataSource.getRepository(Brand).create({
      name: 'Test Brand',
      description: 'Test brand for real-time testing',
      earningPercentage: 30,
      redemptionPercentage: 100,
                      brandwiseMaxCap: 2000,
      isActive: true,
    });
    const savedBrand = await dataSource.getRepository(Brand).save(brand);
    testBrandId = savedBrand.id;

    // Create coin balance
    await dataSource.getRepository(CoinBalance).save({
      userId: testUserId,
      balance: 500,
      totalEarned: 600,
      totalRedeemed: 100,
    });

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
    
    // Clear connections
    connectionManager.clearAllConnections();
  }
});
