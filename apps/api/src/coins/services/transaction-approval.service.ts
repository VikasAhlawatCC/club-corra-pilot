import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { CoinBalance } from '../entities/coin-balance.entity';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ConnectionManager } from '../../websocket/connection.manager';

@Injectable()
export class TransactionApprovalService {
  constructor(
    @InjectRepository(CoinTransaction)
    private transactionRepository: Repository<CoinTransaction>,
    @InjectRepository(CoinBalance)
    private balanceRepository: Repository<CoinBalance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectDataSource() private dataSource: DataSource,
    private connectionManager: ConnectionManager,
  ) {}

  /**
   * Approve an earn transaction
   * - Adds coins to user's balance
   * - Updates transaction status to APPROVED
   * - Updates total earned amount
   */
  async approveEarnTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'brand'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.type !== 'EARN') {
      throw new BadRequestException('Only earn transactions can be approved');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    // Use transaction to ensure data consistency
    return await this.dataSource.transaction(async (manager) => {
      // Update transaction status
      transaction.status = 'APPROVED';
      transaction.processedAt = new Date();
      transaction.adminNotes = adminNotes || transaction.adminNotes;
      
      const updatedTransaction = await manager.save(CoinTransaction, transaction);

      // Update user's coin balance
      let userBalance = await manager.findOne(CoinBalance, {
        where: { userId: transaction.userId },
      });

      if (!userBalance) {
        // Create new balance if it doesn't exist
        userBalance = manager.create(CoinBalance, {
          userId: transaction.userId,
          balance: transaction.amount,
          totalEarned: transaction.amount,
          totalRedeemed: 0,
        });
      } else {
        // Update existing balance
        userBalance.balance += transaction.amount;
        userBalance.totalEarned += transaction.amount;
      }

      await manager.save(CoinBalance, userBalance);

      // Notify admins about the approval
      await this.notifyAdminsOfTransactionUpdate();

      return updatedTransaction;
    });
  }

  /**
   * Reject an earn transaction
   * - No coins are added to user's balance
   * - Updates transaction status to REJECTED
   * - Adds admin notes explaining rejection
   */
  async rejectEarnTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.type !== 'EARN') {
      throw new BadRequestException('Only earn transactions can be rejected');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new BadRequestException('Admin notes are required for rejection');
    }

    // Update transaction status
    transaction.status = 'REJECTED';
    transaction.processedAt = new Date();
    transaction.adminNotes = adminNotes;

    const updatedTransaction = await this.transactionRepository.save(transaction);

    // Notify admins about the rejection
    await this.notifyAdminsOfTransactionUpdate();

    return updatedTransaction;
  }

  /**
   * Approve a redeem transaction
   * - Checks if user has any pending earn requests
   * - Deducts coins from user's balance
   * - Updates transaction status to PROCESSED
   * - Updates total redeemed amount
   */
  async approveRedeemTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'brand'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.type !== 'REDEEM') {
      throw new BadRequestException('Only redeem transactions can be approved');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    // Check if user has any pending earn requests
    const pendingEarnRequests = await this.transactionRepository.count({
      where: {
        userId: transaction.userId,
        type: 'EARN',
        status: 'PENDING',
      },
    });

    if (pendingEarnRequests > 0) {
      throw new ForbiddenException(
        'Cannot approve redeem request. User has pending earn requests that must be processed first.',
      );
    }

    // Use transaction to ensure data consistency
    return await this.dataSource.transaction(async (manager) => {
      // Update transaction status
      transaction.status = 'PROCESSED';
      transaction.processedAt = new Date();
      transaction.adminNotes = adminNotes || transaction.adminNotes;
      
      const updatedTransaction = await manager.save(CoinTransaction, transaction);

      // Update user's coin balance
      const userBalance = await manager.findOne(CoinBalance, {
        where: { userId: transaction.userId },
      });

      if (!userBalance) {
        throw new BadRequestException('User has no coin balance');
      }

      if (userBalance.balance < transaction.amount) {
        throw new BadRequestException('Insufficient coin balance for redemption');
      }

      // Deduct coins from balance
      userBalance.balance -= transaction.amount;
      userBalance.totalRedeemed += transaction.amount;

      await manager.save(CoinBalance, userBalance);

      return updatedTransaction;
    });
  }

  /**
   * Reject a redeem transaction
   * - No coins are deducted from user's balance
   * - Updates transaction status to REJECTED
   * - Adds admin notes explaining rejection
   */
  async rejectRedeemTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.type !== 'REDEEM') {
      throw new BadRequestException('Only redeem transactions can be rejected');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction is not pending approval');
    }

    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new BadRequestException('Admin notes are required for rejection');
    }

    // Update transaction status
    transaction.status = 'REJECTED';
    transaction.processedAt = new Date();
    transaction.adminNotes = adminNotes;

    const updatedTransaction = await this.transactionRepository.save(transaction);

    // Notify admins about the rejection
    await this.notifyAdminsOfTransactionUpdate();

    return updatedTransaction;
  }

  /**
   * Mark a redeem transaction as paid
   * - Requires transaction ID from admin
   * - Updates transaction status to PAID
   * - Records payment completion timestamp
   */
  async markRedeemTransactionAsPaid(
    transactionId: string,
    adminUserId: string,
    paymentTransactionId: string,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.type !== 'REDEEM') {
      throw new BadRequestException('Only redeem transactions can be marked as paid');
    }

    if (transaction.status !== 'PROCESSED') {
      throw new BadRequestException('Transaction must be processed before marking as paid');
    }

    if (!paymentTransactionId || paymentTransactionId.trim().length === 0) {
      throw new BadRequestException('Payment transaction ID is required');
    }

    // Update transaction
    transaction.status = 'PAID';
    transaction.transactionId = paymentTransactionId;
    transaction.paymentProcessedAt = new Date();
    transaction.adminNotes = adminNotes || transaction.adminNotes;

    return await this.transactionRepository.save(transaction);
  }

  /**
   * Get pending transactions for admin review
   */
  async getPendingTransactions(
    page: number = 1,
    limit: number = 20,
    type?: 'EARN' | 'REDEEM',
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.brand', 'brand')
      .where('transaction.status = :status', { status: 'PENDING' })
      .orderBy('transaction.createdAt', 'ASC');

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    const [transactions, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  /**
   * Get transaction statistics for admin dashboard
   */
  async getTransactionStats(): Promise<{
    pendingEarn: number;
    pendingRedeem: number;
    totalEarned: number;
    totalRedeemed: number;
    totalBalance: number;
  }> {
    const [
      pendingEarn,
      pendingRedeem,
      totalEarned,
      totalRedeemed,
      totalBalance,
    ] = await Promise.all([
      this.transactionRepository.count({
        where: { type: 'EARN', status: 'PENDING' },
      }),
      this.transactionRepository.count({
        where: { type: 'REDEEM', status: 'PENDING' },
      }),
      this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.type = :type', { type: 'EARN' })
        .andWhere('transaction.status = :status', { status: 'APPROVED' })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.type = :type', { type: 'REDEEM' })
        .andWhere('transaction.status = :status', { status: 'PAID' })
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
      this.balanceRepository
        .createQueryBuilder('balance')
        .select('SUM(balance.balance)', 'total')
        .getRawOne()
        .then(result => parseFloat(result.total) || 0),
    ]);

    return {
      pendingEarn,
      pendingRedeem,
      totalEarned,
      totalRedeemed,
      totalBalance,
    };
  }

  /**
   * Notify all connected admins about transaction updates
   */
  private async notifyAdminsOfTransactionUpdate(): Promise<void> {
    try {
      // Get current pending counts
      const [pendingEarn, pendingRedeem] = await Promise.all([
        this.transactionRepository.count({
          where: { type: 'EARN', status: 'PENDING' },
        }),
        this.transactionRepository.count({
          where: { type: 'REDEEM', status: 'PENDING' },
        }),
      ]);

      // Notify all connected admins
      await this.connectionManager.sendAdminDashboardUpdate(
        'admin', // This will notify all admins
        pendingEarn,
        pendingRedeem,
      );
    } catch (error) {
      // Log error but don't fail the transaction
      console.error('Failed to notify admins:', error);
    }
  }
}
