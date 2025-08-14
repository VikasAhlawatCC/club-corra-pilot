import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CoinsService } from '../coins.service';
import { WelcomeBonusDto } from '../dto/welcome-bonus.dto';
import { NotificationService } from '../../notifications/notification.service';
import { ConnectionManager } from '../../websocket/connection.manager';

@Controller('admin/coins')
@UseGuards(JwtAuthGuard)
export class CoinAdminController {
  private readonly logger = new Logger(CoinAdminController.name);

  constructor(
    private readonly coinsService: CoinsService,
    private readonly notificationService: NotificationService,
    private readonly connectionManager: ConnectionManager,
  ) {}

  @Post('welcome-bonus')
  async createWelcomeBonus(@Body() welcomeBonusDto: WelcomeBonusDto) {
    try {
      const transaction = await this.coinsService.createWelcomeBonus(welcomeBonusDto);

      // Send real-time balance update
      const balance = await this.coinsService.getUserBalance(welcomeBonusDto.userId);
      await this.connectionManager.sendBalanceUpdate(
        welcomeBonusDto.userId,
        balance.balance - 100,
        balance.balance,
        'EARN',
      );

      // Create notification
      await this.notificationService.createNotification({
        userId: welcomeBonusDto.userId,
        type: 'SYSTEM',
        title: 'Welcome Bonus Received',
        message: 'You have received 100 Corra Coins as a welcome bonus!',
        data: { amount: 100, transactionId: transaction.id },
      });

      return {
        success: true,
        message: 'Welcome bonus created successfully',
        data: {
          transactionId: transaction.id,
          coinsAwarded: 100,
          newBalance: balance.balance,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create welcome bonus: ${error.message}`);
      throw error;
    }
  }

  @Get('balance/:userId')
  async getUserBalance(@Param('userId') userId: string) {
    try {
      const balance = await this.coinsService.getUserBalance(userId);
      
      return {
        success: true,
        message: 'Balance retrieved successfully',
        data: { balance },
      };
    } catch (error) {
      this.logger.error(`Failed to get balance for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('summary/:userId')
  async getUserTransactionSummary(@Param('userId') userId: string) {
    try {
      const balance = await this.coinsService.getUserBalance(userId);
      const transactions = await this.coinsService.getTransactionHistory(userId, 1, 10);
      
      return {
        success: true,
        message: 'Transaction summary retrieved successfully',
        data: {
          balance: balance.balance,
          totalEarned: balance.totalEarned,
          totalRedeemed: balance.totalRedeemed,
          recentTransactions: transactions.data,
          totalTransactions: transactions.total,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction summary for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('transactions')
  async getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('userId') userId?: string,
  ) {
    try {
      if (userId) {
        const transactions = await this.coinsService.getTransactionHistory(userId, page, limit);
        return {
          success: true,
          message: 'User transactions retrieved successfully',
          data: transactions,
        };
      } else {
        // For now, return empty result - could implement admin-level transaction listing later
        return {
          success: true,
          message: 'Admin transaction listing not implemented yet',
          data: {
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          },
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error.message}`);
      throw error;
    }
  }

  @Get('transactions/pending')
  async getPendingTransactions() {
    try {
      // For now, return empty result - could implement pending transaction listing later
      return {
        success: true,
        message: 'Pending transactions listing not implemented yet',
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get pending transactions: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/approve')
  async approveTransaction(@Param('id') id: string, @Body() approveDto: any) {
    try {
      // For now, return not implemented - could implement transaction approval later
      return {
        success: false,
        message: 'Transaction approval not implemented yet',
        data: null,
      };
    } catch (error) {
      this.logger.error(`Failed to approve transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/reject')
  async rejectTransaction(@Param('id') id: string, @Body() rejectDto: any) {
    try {
      // For now, return not implemented - could implement transaction rejection later
      return {
        success: false,
        message: 'Transaction rejection not implemented yet',
        data: null,
      };
    } catch (error) {
      this.logger.error(`Failed to reject transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/process-payment')
  async processPayment(@Param('id') id: string, @Body() processPaymentDto: any) {
    try {
      // For now, return not implemented - could implement payment processing later
      return {
        success: false,
        message: 'Payment processing not implemented yet',
        data: null,
      };
    } catch (error) {
      this.logger.error(`Failed to process payment for transaction ${id}: ${error.message}`);
      throw error;
    }
  }
}
