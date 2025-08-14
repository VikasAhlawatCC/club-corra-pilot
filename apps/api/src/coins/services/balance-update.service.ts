import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinBalance } from '../entities/coin-balance.entity';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { ConnectionManager } from '../../websocket/connection.manager';
import { NotificationService } from '../../notifications/notification.service';

@Injectable()
export class BalanceUpdateService {
  private readonly logger = new Logger(BalanceUpdateService.name);

  constructor(
    @InjectRepository(CoinBalance)
    private readonly coinBalanceRepository: Repository<CoinBalance>,
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    private readonly connectionManager: ConnectionManager,
    private readonly notificationService: NotificationService,
  ) {}

  async updateBalanceForEarnRequest(
    userId: string,
    coinsEarned: number,
    transactionId: string,
  ): Promise<CoinBalance> {
    try {
      let coinBalance = await this.coinBalanceRepository.findOne({ where: { userId } });

      if (!coinBalance) {
        // Create new balance record
        coinBalance = this.coinBalanceRepository.create({
          userId,
          balance: coinsEarned,
          totalEarned: coinsEarned,
          totalRedeemed: 0,
          lastUpdated: new Date(),
        });
        this.logger.log(`New coin balance created for user ${userId}: ${coinsEarned} coins`);
      } else {
        // Update existing balance
        const oldBalance = coinBalance.balance;
        coinBalance.balance += coinsEarned;
        coinBalance.totalEarned += coinsEarned;
        coinBalance.lastUpdated = new Date();
        this.logger.log(`Coin balance updated for user ${userId}: ${oldBalance} -> ${coinBalance.balance} (+${coinsEarned})`);
      }

      const updatedBalance = await this.coinBalanceRepository.save(coinBalance);

      // Send real-time update
      await this.connectionManager.sendBalanceUpdate(
        userId,
        updatedBalance.balance - coinsEarned,
        updatedBalance.balance,
        'EARN',
        transactionId,
      );

      return updatedBalance;
    } catch (error) {
      this.logger.error(`Failed to update balance for earn request: ${error.message}`);
      throw error;
    }
  }

  async updateBalanceForRedeemRequest(
    userId: string,
    coinsRedeemed: number,
    transactionId: string,
  ): Promise<CoinBalance> {
    try {
      const coinBalance = await this.coinBalanceRepository.findOne({ where: { userId } });

      if (!coinBalance) {
        throw new Error('Coin balance not found for user');
      }

      if (coinBalance.balance < coinsRedeemed) {
        throw new Error('Insufficient balance for redemption');
      }

      const oldBalance = coinBalance.balance;
      coinBalance.balance -= coinsRedeemed;
      coinBalance.totalRedeemed += coinsRedeemed;
      coinBalance.lastUpdated = new Date();

      const updatedBalance = await this.coinBalanceRepository.save(coinBalance);

      this.logger.log(`Coin balance updated for user ${userId}: ${oldBalance} -> ${updatedBalance.balance} (-${coinsRedeemed})`);

      // Send real-time update
      await this.connectionManager.sendBalanceUpdate(
        userId,
        oldBalance,
        updatedBalance.balance,
        'REDEEM',
        transactionId,
      );

      return updatedBalance;
    } catch (error) {
      this.logger.error(`Failed to update balance for redeem request: ${error.message}`);
      throw error;
    }
  }

  async rollbackEarnRequest(
    userId: string,
    coinsEarned: number,
    transactionId: string,
  ): Promise<CoinBalance> {
    try {
      const coinBalance = await this.coinBalanceRepository.findOne({ where: { userId } });

      if (!coinBalance) {
        throw new Error('Coin balance not found for user');
      }

      const oldBalance = coinBalance.balance;
      coinBalance.balance -= coinsEarned;
      coinBalance.totalEarned -= coinsEarned;
      coinBalance.lastUpdated = new Date();

      const updatedBalance = await this.coinBalanceRepository.save(coinBalance);

      this.logger.log(`Coin balance rolled back for user ${userId}: ${oldBalance} -> ${updatedBalance.balance} (-${coinsEarned})`);

      // Send real-time update
      await this.connectionManager.sendBalanceUpdate(
        userId,
        oldBalance,
        updatedBalance.balance,
        'EARN_ROLLBACK',
        transactionId,
      );

      return updatedBalance;
    } catch (error) {
      this.logger.error(`Failed to rollback earn request: ${error.message}`);
      throw error;
    }
  }

  async rollbackRedeemRequest(
    userId: string,
    coinsRedeemed: number,
    transactionId: string,
  ): Promise<CoinBalance> {
    try {
      const coinBalance = await this.coinBalanceRepository.findOne({ where: { userId } });

      if (!coinBalance) {
        throw new Error('Coin balance not found for user');
      }

      const oldBalance = coinBalance.balance;
      coinBalance.balance += coinsRedeemed;
      coinBalance.totalRedeemed -= coinsRedeemed;
      coinBalance.lastUpdated = new Date();

      const updatedBalance = await this.coinBalanceRepository.save(coinBalance);

      this.logger.log(`Coin balance rolled back for user ${userId}: ${oldBalance} -> ${updatedBalance.balance} (+${coinsRedeemed})`);

      // Send real-time update
      await this.connectionManager.sendBalanceUpdate(
        userId,
        oldBalance,
        updatedBalance.balance,
        'REDEEM_ROLLBACK',
        transactionId,
      );

      return updatedBalance;
    } catch (error) {
      this.logger.error(`Failed to rollback redeem request: ${error.message}`);
      throw error;
    }
  }

  async getBalanceSummary(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
    pendingEarnRequests: number;
    pendingRedeemRequests: number;
    lastUpdated: Date;
  }> {
    try {
      const coinBalance = await this.coinBalanceRepository.findOne({ where: { userId } });

      if (!coinBalance) {
        return {
          balance: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          pendingEarnRequests: 0,
          pendingRedeemRequests: 0,
          lastUpdated: new Date(),
        };
      }

      const [pendingEarn, pendingRedeem] = await Promise.all([
        this.coinTransactionRepository.count({
          where: {
            userId,
            type: 'EARN',
            status: 'PENDING',
          },
        }),
        this.coinTransactionRepository.count({
          where: {
            userId,
            type: 'REDEEM',
            status: 'PENDING',
          },
        }),
      ]);

      return {
        balance: coinBalance.balance,
        totalEarned: coinBalance.totalEarned,
        totalRedeemed: coinBalance.totalRedeemed,
        pendingEarnRequests: pendingEarn,
        pendingRedeemRequests: pendingRedeem,
        lastUpdated: coinBalance.lastUpdated,
      };
    } catch (error) {
      this.logger.error(`Failed to get balance summary: ${error.message}`);
      throw error;
    }
  }

  async processPayment(
    userId: string,
    transactionId: string,
    adminTransactionId: string,
  ): Promise<void> {
    try {
      // Update transaction status to PAID
      await this.coinTransactionRepository.update(
        { id: transactionId },
        {
          status: 'PAID',
          transactionId: adminTransactionId,
          paymentProcessedAt: new Date(),
        },
      );

      this.logger.log(`Payment processed for transaction ${transactionId} with admin transaction ID ${adminTransactionId}`);

      // Send real-time notification
      await this.connectionManager.sendTransactionStatusUpdate(
        userId,
        transactionId,
        'PAID',
        'Payment processed successfully',
      );

      // Create notification
      await this.notificationService.createTransactionStatusNotification(
        userId,
        transactionId,
        'PAID',
        'Payment processed',
        0,
        `Payment processed with transaction ID: ${adminTransactionId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`);
      throw error;
    }
  }
}
