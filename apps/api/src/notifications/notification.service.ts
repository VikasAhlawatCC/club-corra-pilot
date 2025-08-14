import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'TRANSACTION_STATUS' | 'BALANCE_UPDATE' | 'SYSTEM' | 'PAYMENT_PROCESSED';
  data?: any;
  isRead?: boolean;
}

export interface TransactionStatusNotificationData {
  userId: string;
  transactionId: string;
  status: string;
  brandName: string;
  amount: number;
  notes?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data || {},
        isRead: data.isRead || false,
      } as Partial<Notification>);

      const savedNotification = await this.notificationRepository.save(notification);
      this.logger.log(`Notification created for user ${data.userId}: ${savedNotification.id}`);

      return savedNotification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async createTransactionStatusNotification(
    userId: string,
    transactionId: string,
    status: string,
    brandName: string,
    amount: number,
    notes?: string,
  ): Promise<Notification> {
    const title = `Transaction ${status.toLowerCase()}`;
    let message = `Your ${brandName} transaction for ${amount} coins has been ${status.toLowerCase()}`;
    
    if (notes) {
      message += `. ${notes}`;
    }

    return this.createNotification({
      userId,
      title,
      message,
      type: 'TRANSACTION_STATUS',
      data: {
        transactionId,
        status,
        brandName,
        amount,
        notes,
      },
    });
  }

  async createBalanceUpdateNotification(
    userId: string,
    oldBalance: number,
    newBalance: number,
    changeType: 'EARN' | 'REDEEM' | 'ADJUSTMENT',
    amount: number,
  ): Promise<Notification> {
    const title = 'Balance Updated';
    let message = '';

    switch (changeType) {
      case 'EARN':
        message = `You earned ${amount} coins. New balance: ${newBalance}`;
        break;
      case 'REDEEM':
        message = `You redeemed ${amount} coins. New balance: ${newBalance}`;
        break;
      case 'ADJUSTMENT':
        message = `Your balance was adjusted by ${amount} coins. New balance: ${newBalance}`;
        break;
    }

    return this.createNotification({
      userId,
      title,
      message,
      type: 'BALANCE_UPDATE',
      data: {
        oldBalance,
        newBalance,
        changeType,
        amount,
      },
    });
  }

  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
      type?: 'TRANSACTION_STATUS' | 'BALANCE_UPDATE' | 'SYSTEM' | 'PAYMENT_PROCESSED';
    } = {},
  ): Promise<{ notifications: Notification[]; total: number; page: number; limit: number }> {
    try {
      const { unreadOnly = false, page = 1, limit = 20, type } = options;
      const skip = (page - 1) * limit;

      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId });

      if (unreadOnly) {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
      }

      if (type) {
        queryBuilder.andWhere('notification.type = :type', { type });
      }

      const [notifications, total] = await queryBuilder
        .orderBy('notification.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        notifications,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get user notifications: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.isRead = true;
      notification.readAt = new Date();

      const updatedNotification = await this.notificationRepository.save(notification);
      this.logger.log(`Notification marked as read: ${notificationId}`);

      return updatedNotification;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() },
      );

      this.logger.log(`All notifications marked as read for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({
        id: notificationId,
        userId,
      });

      if (result.affected === 0) {
        throw new Error('Notification not found or access denied');
      }

      this.logger.log(`Notification deleted: ${notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }
  }

  async deleteOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .from(Notification)
        .where('userId = :userId', { userId })
        .andWhere('createdAt < :cutoff', { cutoff: cutoffDate })
        .execute();

      this.logger.log(`Deleted old notifications for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete old notifications: ${error.message}`);
      throw error;
    }
  }
}
