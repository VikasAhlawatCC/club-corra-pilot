import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface UserConnection {
  userId: string;
  socketId: string;
  isAdmin: boolean;
  lastSeen: Date;
}

@Injectable()
export class ConnectionManager {

  private readonly logger = new Logger(ConnectionManager.name);
  private userConnections: Map<string, UserConnection> = new Map();
  private adminConnections: Map<string, UserConnection> = new Map();
  private server: any = null;

  setServer(server: any) {
    this.server = server;
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from user connections
    for (const [userId, connection] of this.userConnections.entries()) {
      if (connection.socketId === client.id) {
        this.userConnections.delete(userId);
        this.logger.log(`User connection removed: ${userId}`);
        break;
      }
    }

    // Remove from admin connections
    for (const [adminId, connection] of this.adminConnections.entries()) {
      if (connection.socketId === client.id) {
        this.adminConnections.delete(adminId);
        this.logger.log(`Admin connection removed: ${adminId}`);
        break;
      }
    }
  }

  registerUserConnection(userId: string, socketId: string, isAdmin: boolean = false): void {
    const connection: UserConnection = {
      userId,
      socketId,
      isAdmin,
      lastSeen: new Date(),
    };

    if (isAdmin) {
      this.adminConnections.set(userId, connection);
      this.logger.log(`Admin connection registered: ${userId}`);
    } else {
      this.userConnections.set(userId, connection);
      this.logger.log(`User connection registered: ${userId}`);
    }
  }

  async sendBalanceUpdate(
    userId: string,
    oldBalance: number,
    newBalance: number,
    changeType: 'EARN' | 'REDEEM' | 'EARN_ROLLBACK' | 'REDEEM_ROLLBACK',
    transactionId?: string,
  ): Promise<void> {
    try {
      const connection = this.userConnections.get(userId);
      if (!connection) {
        this.logger.debug(`No active connection for user: ${userId}`);
        return;
      }

      const socket = this.server.sockets.sockets.get(connection.socketId);
      if (socket) {
        socket.emit('balance_updated', {
          event: 'balance_updated',
          data: {
            oldBalance,
            newBalance,
            changeType,
            transactionId,
            timestamp: new Date().toISOString(),
          },
          userId,
        });

        this.logger.log(`Balance update sent to user ${userId}: ${oldBalance} -> ${newBalance}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send balance update: ${error.message}`);
    }
  }

  async sendTransactionStatusUpdate(
    userId: string,
    transactionId: string,
    status: string,
    message: string,
  ): Promise<void> {
    try {
      const connection = this.userConnections.get(userId);
      if (!connection) {
        this.logger.debug(`No active connection for user: ${userId}`);
        return;
      }

      const socket = this.server.sockets.sockets.get(connection.socketId);
      if (socket) {
        socket.emit('transaction_status_changed', {
          event: 'transaction_status_changed',
          data: {
            transactionId,
            status,
            message,
            timestamp: new Date().toISOString(),
          },
          userId,
        });

        this.logger.log(`Transaction status update sent to user ${userId}: ${transactionId} -> ${status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send transaction status update: ${error.message}`);
    }
  }

  async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      const connection = this.userConnections.get(userId);
      if (!connection) {
        this.logger.debug(`No active connection for user: ${userId}`);
        return;
      }

      const socket = this.server.sockets.sockets.get(connection.socketId);
      if (socket) {
        socket.emit('notification_received', {
          event: 'notification_received',
          data: notification,
          userId,
        });

        this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  async notifyAdminsPendingRequest(requestType: 'EARN' | 'REDEEM', count: number): Promise<void> {
    try {
      for (const [adminId, connection] of this.adminConnections.entries()) {
        const socket = this.server.sockets.sockets.get(connection.socketId);
        if (socket) {
          socket.emit('admin_request_pending', {
            event: 'admin_request_pending',
            data: {
              requestType,
              count,
              timestamp: new Date().toISOString(),
            },
            adminId,
          });

          this.logger.log(`Pending request notification sent to admin ${adminId}: ${requestType} - ${count}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to notify admins: ${error.message}`);
    }
  }

  async broadcastToAllUsers(event: string, data: any): Promise<void> {
    try {
      this.server.emit(event, data);
      this.logger.log(`Broadcast sent to all users: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast to all users: ${error.message}`);
    }
  }

  async broadcastToAdmins(event: string, data: any): Promise<void> {
    try {
      for (const [adminId, connection] of this.adminConnections.entries()) {
        const socket = this.server.sockets.sockets.get(connection.socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
      this.logger.log(`Broadcast sent to all admins: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast to admins: ${error.message}`);
    }
  }

  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  getConnectedAdminsCount(): number {
    return this.adminConnections.size;
  }

  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  isAdminConnected(adminId: string): boolean {
    return this.adminConnections.has(adminId);
  }

  getUserConnection(userId: string): UserConnection | undefined {
    return this.userConnections.get(userId);
  }

  getAdminConnection(adminId: string): UserConnection | undefined {
    return this.adminConnections.get(adminId);
  }

  getAllConnections(): { users: UserConnection[]; admins: UserConnection[] } {
    return {
      users: Array.from(this.userConnections.values()),
      admins: Array.from(this.adminConnections.values()),
    };
  }
}
