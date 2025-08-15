import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConnectionManager } from './connection.manager';

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: [
      // Local development - prioritize localhost
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Development environment - allow local network access
      'http://192.168.1.4:3000',
      'http://192.168.1.4:3001',
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^exp:\/\/192\.168\.\d+\.\d+:\d+$/,
      'exp://localhost:8081',
      'exp://127.0.0.1:8081',
      'exp+club-corra-pilot://expo-development-client',
      // Production domains (when deployed)
      'https://admin.clubcorra.com',
      'https://*.clubcorra.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly connectionManager: ConnectionManager) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.logger.log(`Server options: ${JSON.stringify(server.engine.opts)}`);
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Client transport: ${client.conn.transport.name}`);
    this.logger.log(`Client headers: ${JSON.stringify(client.handshake.headers)}`);
    this.logger.log(`Client origin: ${client.handshake.headers.origin}`);
    
    this.connectionManager.setServer(this.server);
    this.connectionManager.handleConnection(client);
    
    // Send welcome message
    client.emit('connected', { 
      message: 'Connected to ClubCorra WebSocket server',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.log(`Client connected state: ${client.connected}`);
    this.connectionManager.handleDisconnect(client);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    this.logger.log(`Ping received from client: ${client.id}`);
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('error')
  handleError(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
    this.logger.error(`Error from client ${client.id}:`, data);
  }

  @SubscribeMessage('connect_error')
  handleConnectError(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
    this.logger.error(`Connection error from client ${client.id}:`, data);
  }

  @SubscribeMessage('disconnect')
  handleClientDisconnect(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
    this.logger.log(`Client ${client.id} requested disconnect:`, data);
  }

  @SubscribeMessage('ADMIN_SUBSCRIBE')
  handleAdminSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
    try {
      this.logger.log(`Admin subscription request from client: ${client.id}`);
      
      // Mark this client as an admin
      this.connectionManager.registerUserConnection('admin-' + client.id, client.id, true);
      
      // Send confirmation
      client.emit('admin_subscribed', { 
        message: 'Admin subscription confirmed',
        timestamp: new Date().toISOString()
      });
      
      this.logger.log(`Admin subscription confirmed for client: ${client.id}`);
      
      // Send current pending counts
      this.sendCurrentPendingCounts(client);
      
    } catch (error) {
      this.logger.error(`Error handling admin subscription: ${error.message}`, error.stack);
      // Don't disconnect the client, just log the error
      client.emit('error', { 
        message: 'Failed to process admin subscription',
        error: error.message 
      });
    }
  }

  @SubscribeMessage('GET_PENDING_COUNTS')
  handleGetPendingCounts(@ConnectedSocket() client: Socket): void {
    try {
      this.logger.log(`Pending counts request from client: ${client.id}`);
      this.sendCurrentPendingCounts(client);
    } catch (error) {
      this.logger.error(`Error handling pending counts request: ${error.message}`, error.stack);
      // Don't disconnect the client, just log the error
      client.emit('error', { 
        message: 'Failed to get pending counts',
        error: error.message 
      });
    }
  }

  private async sendCurrentPendingCounts(client: Socket): Promise<void> {
    try {
      // TODO: Get actual pending counts from database
      // For now, send mock data
      const pendingCounts = {
        earn: 5,
        redeem: 3,
        total: 8
      };
      
      client.emit('admin_dashboard_update', {
        type: 'admin_dashboard_update',
        data: {
          pendingRequestCounts: pendingCounts,
          timestamp: new Date().toISOString()
        }
      });
      
      this.logger.log(`Sent pending counts to admin client: ${client.id}`);
    } catch (error) {
      this.logger.error(`Failed to send pending counts: ${error.message}`, error.stack);
      // Don't disconnect the client, just log the error
      client.emit('error', { 
        message: 'Failed to send pending counts',
        error: error.message 
      });
    }
  }

  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  getConnectedUsers(): string[] {
    // This would return actual connected user IDs from ConnectionManager
    return [];
  }

  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }
}
