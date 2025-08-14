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
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://192.168.1.5:3000',
      'http://192.168.1.5:3001',
      'exp://192.168.1.5:8081',
      'exp://localhost:8081',
      'exp://127.0.0.1:8081',
      'exp+club-corra-pilot://expo-development-client'
    ],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly connectionManager: ConnectionManager) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectionManager.setServer(this.server);
    this.connectionManager.handleConnection(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectionManager.handleDisconnect(client);
  }

  @SubscribeMessage('register_user')
  handleRegisterUser(
    @MessageBody() data: { userId: string; isAdmin?: boolean },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId, isAdmin = false } = data;
    this.connectionManager.registerUserConnection(userId, client.id, isAdmin);
    this.logger.log(`User registered: ${userId} (${isAdmin ? 'admin' : 'user'})`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
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
