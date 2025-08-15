import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { TransactionApprovalService } from './transaction-approval.service';

export interface PaymentProcessingRequest {
  transactionId: string;
  adminUserId: string;
  paymentTransactionId: string;
  paymentMethod: string;
  paymentAmount: number;
  adminNotes?: string;
}

export interface PaymentSummary {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  brandName: string;
  coinAmount: number;
  paymentAmount: number;
  paymentMethod: string;
  paymentTransactionId: string;
  status: string;
  createdAt: Date;
  paymentProcessedAt: Date;
}

@Injectable()
export class PaymentProcessingService {
  constructor(
    @InjectRepository(CoinTransaction)
    private transactionRepository: Repository<CoinTransaction>,
    private transactionApprovalService: TransactionApprovalService,
  ) {}

  /**
   * Process payment for a redeem transaction
   * - Validates the transaction is ready for payment
   * - Records payment details
   * - Marks transaction as paid
   */
  async processPayment(
    paymentRequest: PaymentProcessingRequest,
  ): Promise<CoinTransaction> {
    const { transactionId, adminUserId, paymentTransactionId, paymentMethod, paymentAmount, adminNotes } = paymentRequest;

    // Validate payment request
    if (!paymentTransactionId || paymentTransactionId.trim().length === 0) {
      throw new BadRequestException('Payment transaction ID is required');
    }

    if (!paymentMethod || paymentMethod.trim().length === 0) {
      throw new BadRequestException('Payment method is required');
    }

    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Get the transaction
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'brand'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.type !== 'REDEEM') {
      throw new BadRequestException('Only redeem transactions can be processed for payment');
    }

    if (transaction.status !== 'PROCESSED') {
      throw new BadRequestException('Transaction must be processed before payment can be made');
    }

    // Validate payment amount matches coin amount (with some tolerance for exchange rates)
    const coinAmount = transaction.amount;
    const expectedPaymentAmount = this.calculateExpectedPaymentAmount(coinAmount);
    
    if (Math.abs(paymentAmount - expectedPaymentAmount) > 0.01) {
      throw new BadRequestException(
        `Payment amount ${paymentAmount} does not match expected amount ${expectedPaymentAmount} for ${coinAmount} coins`
      );
    }

    // Check if payment transaction ID is already used
    const existingPayment = await this.transactionRepository.findOne({
      where: { transactionId: paymentTransactionId },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment transaction ID is already in use');
    }

    // Process the payment using the approval service
    const updatedTransaction = await this.transactionApprovalService.markRedeemTransactionAsPaid(
      transactionId,
      adminUserId,
      paymentTransactionId,
      adminNotes,
    );

    // Add additional payment metadata if needed
    // Note: You might want to create a separate payment_metadata table for this
    // For now, we'll use the adminNotes field to store additional payment info
    if (paymentMethod || paymentAmount) {
      const paymentInfo = {
        method: paymentMethod,
        amount: paymentAmount,
        processedBy: adminUserId,
        processedAt: new Date(),
      };
      
      updatedTransaction.adminNotes = `${updatedTransaction.adminNotes || ''}\n\nPayment Info: ${JSON.stringify(paymentInfo)}`;
      await this.transactionRepository.save(updatedTransaction);
    }

    return updatedTransaction;
  }

  /**
   * Get payment summary for a transaction
   */
  async getPaymentSummary(transactionId: string): Promise<PaymentSummary> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'brand'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.type !== 'REDEEM') {
      throw new BadRequestException('Only redeem transactions have payment summaries');
    }

    // Extract payment information from admin notes
    const paymentInfo = this.extractPaymentInfo(transaction.adminNotes);
    
    return {
      transactionId: transaction.id,
      userId: transaction.userId,
              userName: `${transaction.user?.profile?.firstName || ''} ${transaction.user?.profile?.lastName || ''}`.trim() || 'Unknown User',
      userEmail: transaction.user?.email || 'Unknown Email',
      brandName: transaction.brand?.name || 'Unknown Brand',
      coinAmount: transaction.amount,
      paymentAmount: paymentInfo.amount || 0,
      paymentMethod: paymentInfo.method || 'Unknown',
      paymentTransactionId: transaction.transactionId || '',
      status: transaction.status,
      createdAt: transaction.createdAt,
      paymentProcessedAt: transaction.paymentProcessedAt || new Date(),
    };
  }

  /**
   * Get all paid transactions for reporting
   */
  async getPaidTransactions(
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ transactions: PaymentSummary[]; total: number }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.brand', 'brand')
      .where('transaction.type = :type', { type: 'REDEEM' })
      .andWhere('transaction.status = :status', { status: 'PAID' })
      .orderBy('transaction.paymentProcessedAt', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('transaction.paymentProcessedAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('transaction.paymentProcessedAt <= :endDate', { endDate });
    }

    const [transactions, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const paymentSummaries = transactions.map(transaction => {
      const paymentInfo = this.extractPaymentInfo(transaction.adminNotes);
      
      return {
        transactionId: transaction.id,
        userId: transaction.userId,
        userName: `${transaction.user?.profile?.firstName || ''} ${transaction.user?.profile?.lastName || ''}`.trim() || 'Unknown User',
        userEmail: transaction.user?.email || 'Unknown Email',
        brandName: transaction.brand?.name || 'Unknown Brand',
        coinAmount: transaction.amount,
        paymentAmount: paymentInfo.amount || 0,
        paymentMethod: paymentInfo.method || 'Unknown',
        paymentTransactionId: transaction.transactionId || '',
        status: transaction.status,
        createdAt: transaction.createdAt,
        paymentProcessedAt: transaction.paymentProcessedAt || new Date(),
      };
    });

    return { transactions: paymentSummaries, total };
  }

  /**
   * Calculate expected payment amount based on coin amount
   * This is a placeholder - implement your actual exchange rate logic
   */
  private calculateExpectedPaymentAmount(coinAmount: number): number {
    // For now, assume 1 coin = 1 currency unit
    // In a real implementation, you would fetch current exchange rates
    return coinAmount;
  }

  /**
   * Extract payment information from admin notes
   * This is a simple parser - you might want to use a more robust approach
   */
  private extractPaymentInfo(adminNotes?: string): { method?: string; amount?: number } {
    if (!adminNotes) return {};

    try {
      const paymentInfoMatch = adminNotes.match(/Payment Info: ({.*})/);
      if (paymentInfoMatch) {
        const paymentInfo = JSON.parse(paymentInfoMatch[1]);
        return {
          method: paymentInfo.method,
          amount: paymentInfo.amount,
        };
      }
    } catch (error) {
      // If parsing fails, return empty object
    }

    return {};
  }

  /**
   * Get payment statistics for admin dashboard
   */
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalPaid: number;
    totalAmount: number;
    averageAmount: number;
    paymentMethods: Record<string, number>;
  }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.type = :type', { type: 'REDEEM' })
      .andWhere('transaction.status = :status', { status: 'PAID' });

    if (startDate) {
      queryBuilder.andWhere('transaction.paymentProcessedAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('transaction.paymentProcessedAt <= :endDate', { endDate });
    }

    const transactions = await queryBuilder.getMany();

    let totalAmount = 0;
    const paymentMethods: Record<string, number> = {};

    transactions.forEach(transaction => {
      const paymentInfo = this.extractPaymentInfo(transaction.adminNotes);
      if (paymentInfo.amount) {
        totalAmount += paymentInfo.amount;
      }
      if (paymentInfo.method) {
        paymentMethods[paymentInfo.method] = (paymentMethods[paymentInfo.method] || 0) + 1;
      }
    });

    return {
      totalPaid: transactions.length,
      totalAmount,
      averageAmount: transactions.length > 0 ? totalAmount / transactions.length : 0,
      paymentMethods,
    };
  }
}
