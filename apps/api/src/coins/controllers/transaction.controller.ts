import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CoinsService } from '../coins.service';
import { CreateEarnRequestDto } from '../dto/create-earn-request.dto';
import { CreateRedeemRequestDto } from '../dto/create-redeem-request.dto';
import { TransactionValidationService } from '../services/transaction-validation.service';
import { BalanceUpdateService } from '../services/balance-update.service';
import { NotificationService } from '../../notifications/notification.service';
import { ConnectionManager } from '../../websocket/connection.manager';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(
    private readonly coinsService: CoinsService,
    private readonly transactionValidationService: TransactionValidationService,
    private readonly balanceUpdateService: BalanceUpdateService,
    private readonly notificationService: NotificationService,
    private readonly connectionManager: ConnectionManager,
  ) {}

  @Post('earn')
  async createEarnRequest(
    @Body() createEarnRequestDto: CreateEarnRequestDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const { brandId, billAmount, billDate, receiptUrl, notes } = createEarnRequestDto;

    try {
      // Validate the earn request
      await this.transactionValidationService.validateEarnRequest({
        userId,
        brandId,
        billAmount,
        billDate: new Date(billDate),
      });

      // Create the earn transaction
      const transaction = await this.coinsService.createEarnRequest(
        userId,
        createEarnRequestDto,
      );

      // Get updated balance
      const balance = await this.coinsService.getUserBalance(userId);

      // Send real-time updates
      await this.connectionManager.sendBalanceUpdate(
        userId,
        balance.balance - transaction.coinsEarned,
        balance.balance,
        'EARN',
      );

      // Create notification
      await this.notificationService.createTransactionStatusNotification(
        userId,
        transaction.id,
        'PENDING',
        transaction.brand?.name || 'Unknown Brand',
        transaction.coinsEarned,
      );

      // Notify admins about new pending request
      // const pendingCount = await this.coinsService.getPendingEarnRequestsCount();
      // await this.connectionManager.notifyAdminsPendingRequest('EARN', pendingCount);

      this.logger.log(`Earn request created for user ${userId}: ${transaction.id}`);

      return {
        success: true,
        message: 'Earn request submitted successfully',
        transaction: {
          id: transaction.id,
          type: 'EARN',
          status: 'PENDING',
          billAmount,
          billDate: new Date(billDate),
          coinsEarned: transaction.coinsEarned,
          brand: transaction.brand,
          createdAt: transaction.createdAt,
        },
        newBalance: balance.balance,
      };
    } catch (error) {
      this.logger.error(`Failed to create earn request for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('redeem')
  async createRedeemRequest(
    @Body() createRedeemRequestDto: CreateRedeemRequestDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const { brandId, billAmount, coinsToRedeem, notes } = createRedeemRequestDto;

    try {
      // Validate the redeem request
      await this.transactionValidationService.validateRedeemRequest({
        userId,
        brandId,
        billAmount,
        coinsToRedeem,
      });

      // Create the redeem transaction
      const transaction = await this.coinsService.createRedeemRequest(
        userId,
        createRedeemRequestDto,
      );

      // Get updated balance
      const balance = await this.coinsService.getUserBalance(userId);

      // Send real-time updates
      await this.connectionManager.sendBalanceUpdate(
        userId,
        balance.balance + coinsToRedeem,
        balance.balance,
        'REDEEM',
      );

      // Create notification
      await this.notificationService.createTransactionStatusNotification(
        userId,
        transaction.id,
        'PENDING',
        transaction.brand?.name || 'Unknown Brand',
        -coinsToRedeem,
      );

      // Notify admins about new pending request
      // const pendingCount = await this.coinsService.getPendingRedeemRequestsCount();
      // await this.connectionManager.notifyAdminsPendingRequest('REDEEM', pendingCount);

      this.logger.log(`Redeem request created for user ${userId}: ${transaction.id}`);

      return {
        success: true,
        message: 'Redeem request submitted successfully',
        transaction: {
          id: transaction.id,
          type: 'REDEEM',
          status: 'PENDING',
          billAmount,
          billDate: new Date(),
          coinsRedeemed: transaction.coinsRedeemed,
          brand: transaction.brand,
          createdAt: transaction.createdAt,
        },
        newBalance: balance.balance,
      };
    } catch (error) {
      this.logger.error(`Failed to create redeem request for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get()
  async getTransactions(
    @Query() searchDto: any,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const { page = 1, limit = 20 } = searchDto;

    try {
      const transactions = await this.coinsService.getTransactionHistory(userId, page, limit);

      const total = transactions.total;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          transactions,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get transactions for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub;

    try {
      // Import the repository and query directly since the service method doesn't exist
      const transaction = await this.coinsService['transactionRepository'].findOne({
        where: { id, userId },
        relations: ['brand', 'user'],
      });

      if (!transaction) {
        throw new BadRequestException('Transaction not found');
      }

      // Ensure user can only access their own transactions
      if (transaction.userId !== userId) {
        throw new BadRequestException('Access denied to this transaction');
      }

      return {
        success: true,
        message: 'Transaction retrieved successfully',
        data: {
          transaction: {
            ...transaction,
            brand: transaction.brand,
            user: transaction.user,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction ${id} for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
