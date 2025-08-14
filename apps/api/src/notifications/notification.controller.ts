import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @Query() query: {
      unreadOnly?: string | boolean;
      page?: string | number;
      limit?: string | number;
      type?: 'TRANSACTION_STATUS' | 'BALANCE_UPDATE' | 'SYSTEM' | 'PAYMENT_PROCESSED';
    },
    @Request() req,
  ) {
    const userId = req.user.sub;
    const { unreadOnly, page, limit, type } = query;

    try {
      const result = await this.notificationService.getUserNotifications(userId, {
        unreadOnly: typeof unreadOnly === 'string' ? unreadOnly === 'true' : !!unreadOnly,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        type,
      });

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub;

    try {
      const count = await this.notificationService.getUnreadCount(userId);

      return {
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: count },
      };
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;

    try {
      const notification = await this.notificationService.markAsRead(id, userId);

      return {
        success: true,
        message: 'Notification marked as read',
        data: { notification },
      };
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      throw error;
    }
  }

  @Put('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user.sub;

    try {
      await this.notificationService.markAllAsRead(userId);

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/delete')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;

    try {
      await this.notificationService.deleteNotification(id, userId);

      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw error;
    }
  }
}
