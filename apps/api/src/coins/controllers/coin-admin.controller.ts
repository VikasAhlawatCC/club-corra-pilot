import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CoinsService } from '../coins.service';
import { WelcomeBonusDto } from '../dto/welcome-bonus.dto';
import { NotificationService } from '../../notifications/notification.service';
import { ConnectionManager } from '../../websocket/connection.manager';

@Controller('admin/coins')
@UseGuards(JwtAuthGuard, AdminGuard)
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
  async getPendingTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: 'EARN' | 'REDEEM',
  ) {
    try {
      const result = await this.coinsService.getPendingTransactions(
        parseInt(page.toString()),
        parseInt(limit.toString()),
        type,
      );
      
      // Transform the result to match frontend expectations
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        success: true,
        message: 'Pending transactions retrieved successfully',
        data: {
          data: result.transactions,
          total: result.total,
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get pending transactions: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/approve')
  async approveTransaction(
    @Param('id') id: string,
    @Body() approveDto: { adminNotes?: string; adminUserId: string },
  ) {
    try {
      const transaction = await this.coinsService.approveEarnTransaction(
        id,
        approveDto.adminUserId,
        approveDto.adminNotes,
      );
      
      return {
        success: true,
        message: 'Transaction approved successfully',
        data: { transaction },
      };
    } catch (error) {
      this.logger.error(`Failed to approve transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/reject')
  async rejectTransaction(
    @Param('id') id: string,
    @Body() rejectDto: { adminNotes: string; adminUserId: string },
  ) {
    try {
      const transaction = await this.coinsService.rejectEarnTransaction(
        id,
        rejectDto.adminUserId,
        rejectDto.adminNotes,
      );
      
      return {
        success: true,
        message: 'Transaction rejected successfully',
        data: { transaction },
      };
    } catch (error) {
      this.logger.error(`Failed to reject transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/process-payment')
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: {
      adminUserId: string;
      paymentTransactionId: string;
      paymentMethod: string;
      paymentAmount: number;
      adminNotes?: string;
    },
  ) {
    try {
      const transaction = await this.coinsService.processPayment(
        id,
        processPaymentDto.adminUserId,
        processPaymentDto.paymentTransactionId,
        processPaymentDto.paymentMethod,
        processPaymentDto.paymentAmount,
        processPaymentDto.adminNotes,
      );
      
      return {
        success: true,
        message: 'Payment processed successfully',
        data: { transaction },
      };
    } catch (error) {
      this.logger.error(`Failed to process payment for transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/approve-redeem')
  async approveRedeemTransaction(
    @Param('id') id: string,
    @Body() approveDto: { adminNotes?: string; adminUserId: string },
  ) {
    try {
      const transaction = await this.coinsService.approveRedeemTransaction(
        id,
        approveDto.adminUserId,
        approveDto.adminNotes,
      );
      
      return {
        success: true,
        message: 'Redeem transaction approved successfully',
        data: { transaction },
      };
    } catch (error) {
      this.logger.error(`Failed to approve redeem transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Put('transactions/:id/reject-redeem')
  async rejectRedeemTransaction(
    @Param('id') id: string,
    @Body() rejectDto: { adminNotes: string; adminUserId: string },
  ) {
    try {
      const transaction = await this.coinsService.rejectRedeemTransaction(
        id,
        rejectDto.adminUserId,
        rejectDto.adminNotes,
      );
      
      return {
        success: true,
        message: 'Redeem transaction rejected successfully',
        data: { transaction },
      };
    } catch (error) {
      this.logger.error(`Failed to reject redeem transaction ${id}: ${error.message}`);
      throw error;
    }
  }

  @Get('stats/transactions')
  async getTransactionStats() {
    try {
      const stats = await this.coinsService.getTransactionStats();
      
      return {
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction stats: ${error.message}`);
      throw error;
    }
  }

  @Get('stats/payments')
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const stats = await this.coinsService.getPaymentStats(start, end);
      
      return {
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment stats: ${error.message}`);
      throw error;
    }
  }

  @Get('payments/:transactionId/summary')
  async getPaymentSummary(@Param('transactionId') transactionId: string) {
    try {
      const summary = await this.coinsService.getPaymentSummary(transactionId);
      
      return {
        success: true,
        message: 'Payment summary retrieved successfully',
        data: summary,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment summary for ${transactionId}: ${error.message}`);
      throw error;
    }
  }
}
