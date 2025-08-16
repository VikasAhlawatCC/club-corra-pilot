import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinBalance } from './entities/coin-balance.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { Brand } from '../brands/entities/brand.entity';
import { User } from '../users/entities/user.entity';
import { CreateEarnRequestDto } from './dto/create-earn-request.dto';
import { CreateRedeemRequestDto } from './dto/create-redeem-request.dto';
import { WelcomeBonusDto } from './dto/welcome-bonus.dto';
import { WebsocketModule } from '../websocket/websocket.module';
import { ConnectionManager } from '../websocket/connection.manager';
import { TransactionApprovalService } from './services/transaction-approval.service';
import { PaymentProcessingService } from './services/payment-processing.service';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(CoinBalance)
    private readonly balanceRepository: Repository<CoinBalance>,
    @InjectRepository(CoinTransaction)
    private readonly transactionRepository: Repository<CoinTransaction>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly connectionManager: ConnectionManager,
    private readonly transactionApprovalService: TransactionApprovalService,
    private readonly paymentProcessingService: PaymentProcessingService,
  ) {}

  async createEarnRequest(userId: string, createEarnRequestDto: CreateEarnRequestDto): Promise<CoinTransaction> {
    const { brandId, billAmount, billDate, receiptUrl } = createEarnRequestDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate brand exists and is active
    const brand = await this.brandRepository.findOne({ where: { id: brandId, isActive: true } });
    if (!brand) {
      throw new NotFoundException('Brand not found or inactive');
    }

    // Calculate coins earned based on brand's earning percentage
    const coinsEarned = (billAmount * brand.earningPercentage) / 100;

    // Create transaction
    const transaction = this.transactionRepository.create({
      userId,
      brandId,
      type: 'EARN',
      amount: coinsEarned,
      billAmount,
      coinsEarned,
      billDate: new Date(billDate),
      receiptUrl,
      status: 'PENDING',
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    savedTransaction.brand = brand;

    // Send real-time update
    await this.connectionManager.sendTransactionStatusUpdate(
      userId,
      savedTransaction.id,
      'PENDING',
      brand.name,
    );

    return savedTransaction;
  }

  async createRedeemRequest(userId: string, createRedeemRequestDto: CreateRedeemRequestDto): Promise<CoinTransaction> {
    const { brandId, coinsToRedeem, billAmount } = createRedeemRequestDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate brand exists and is active
    const brand = await this.brandRepository.findOne({ where: { id: brandId, isActive: true } });
    if (!brand) {
      throw new NotFoundException('Brand not found or inactive');
    }

    // Check user has sufficient balance
    const balance = await this.getUserBalance(userId);
    if (balance.balance < coinsToRedeem) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // Validate redemption amount against brand limits
    if (coinsToRedeem < brand.minRedemptionAmount || coinsToRedeem > brand.maxRedemptionAmount) {
      throw new BadRequestException(
        `Redemption amount must be between ${brand.minRedemptionAmount} and ${brand.maxRedemptionAmount} coins`
      );
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      userId,
      brandId,
      type: 'REDEEM',
      amount: -coinsToRedeem,
      billAmount,
      coinsRedeemed: coinsToRedeem,
      status: 'PENDING',
    });

    const savedTransaction = await this.transactionRepository.save(transaction);
    savedTransaction.brand = brand;

    // Send real-time update
    await this.connectionManager.sendTransactionStatusUpdate(
      userId,
      savedTransaction.id,
      'PENDING',
      brand.name,
    );

    return savedTransaction;
  }

  async createWelcomeBonus(createWelcomeBonusDto: WelcomeBonusDto): Promise<CoinTransaction> {
    const { userId, mobileNumber } = createWelcomeBonusDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already received welcome bonus
    const existingBonus = await this.transactionRepository.findOne({
      where: { userId, type: 'WELCOME_BONUS' },
    });

    if (existingBonus) {
      throw new BadRequestException('User already received welcome bonus');
    }

    // Default welcome bonus amount (could be configurable)
    const amount = 100;

    // Create transaction
    const transaction = this.transactionRepository.create({
      userId,
      type: 'WELCOME_BONUS',
      amount,
      status: 'APPROVED',
      processedAt: new Date(),
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update user balance
    await this.updateUserBalance(userId, amount);

    // Send real-time update
    await this.connectionManager.sendBalanceUpdate(
      userId,
      (await this.getUserBalance(userId)).balance - amount,
      (await this.getUserBalance(userId)).balance,
      'EARN',
    );

    return savedTransaction;
  }

  async getUserBalance(userId: string): Promise<CoinBalance> {
    console.log('[CoinsService] Getting balance for userId:', userId);
    let balance = await this.balanceRepository.findOne({ where: { userId } });
    console.log('[CoinsService] Raw balance from DB:', balance);

    if (!balance) {
      console.log('[CoinsService] No balance found, creating new balance record');
      // Create new balance record
      balance = this.balanceRepository.create({
        userId,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
      });
      await this.balanceRepository.save(balance);
      console.log('[CoinsService] Created new balance record:', balance);
    }

    console.log('[CoinsService] Final balance object:', {
      id: balance.id,
      userId: balance.userId,
      balance: balance.balance,
      balanceType: typeof balance.balance,
      totalEarned: balance.totalEarned,
      totalEarnedType: typeof balance.totalEarned,
      totalRedeemed: balance.totalRedeemed,
      totalRedeemedType: typeof balance.totalRedeemed
    });

    return balance;
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    const balance = await this.getUserBalance(userId);
    
    balance.balance += amount;
    
    if (amount > 0) {
      balance.totalEarned += amount;
    } else {
      balance.totalRedeemed += Math.abs(amount);
    }

    await this.balanceRepository.save(balance);
  }

  async getTransactionHistory(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      relations: ['brand'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin approval methods
  async approveEarnTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionApprovalService.approveEarnTransaction(
      transactionId,
      adminUserId,
      adminNotes,
    );

    // Send real-time balance update
    const userBalance = await this.getUserBalance(transaction.userId);
    await this.connectionManager.sendRealTimeBalanceUpdate(
      transaction.userId,
      userBalance.balance,
      transaction.id,
      'EARN',
      'APPROVED',
    );

    // Send transaction approval notification
    await this.connectionManager.sendTransactionApprovalNotification(
      transaction.userId,
      transaction.id,
      'EARN',
      'APPROVED',
      adminNotes,
    );

    return transaction;
  }

  async rejectEarnTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionApprovalService.rejectEarnTransaction(
      transactionId,
      adminUserId,
      adminNotes,
    );

    // Send transaction rejection notification
    await this.connectionManager.sendTransactionApprovalNotification(
      transaction.userId,
      transaction.id,
      'EARN',
      'REJECTED',
      adminNotes,
    );

    return transaction;
  }

  async approveRedeemTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    // Validate that user can have redeem request approved
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'brand'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if user has all pending earn requests verified
    const canApprove = await this.canApproveRedeemRequest(transaction.userId);
    if (!canApprove) {
      throw new BadRequestException(
        'Cannot approve redeem request. User has pending earn requests that must be processed first.',
      );
    }

    return await this.transactionApprovalService.approveRedeemTransaction(
      transactionId,
      adminUserId,
      adminNotes,
    );
  }

  async rejectRedeemTransaction(
    transactionId: string,
    adminUserId: string,
    adminNotes: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.transactionApprovalService.rejectRedeemTransaction(
      transactionId,
      adminUserId,
      adminNotes,
    );

    // Send transaction rejection notification
    await this.connectionManager.sendTransactionApprovalNotification(
      transaction.userId,
      transaction.id,
      'REDEEM',
      'REJECTED',
      adminNotes,
    );

    return transaction;
  }

  async processPayment(
    transactionId: string,
    adminUserId: string,
    paymentTransactionId: string,
    paymentMethod: string,
    paymentAmount: number,
    adminNotes?: string,
  ): Promise<CoinTransaction> {
    const transaction = await this.paymentProcessingService.processPayment({
      transactionId,
      adminUserId,
      paymentTransactionId,
      paymentMethod,
      paymentAmount,
      adminNotes,
    });

    // Send real-time balance update
    const userBalance = await this.getUserBalance(transaction.userId);
    await this.connectionManager.sendRealTimeBalanceUpdate(
      transaction.userId,
      userBalance.balance,
      transaction.id,
      'REDEEM',
      'PAID',
    );

    // Send transaction approval notification
    await this.connectionManager.sendTransactionApprovalNotification(
      transaction.userId,
      transaction.id,
      'REDEEM',
      'PAID',
      adminNotes,
    );

    return transaction;
  }

  // Admin query methods
  async getPendingTransactions(page: number = 1, limit: number = 20, type?: 'EARN' | 'REDEEM') {
    return await this.transactionApprovalService.getPendingTransactions(page, limit, type);
  }

  async getTransactionStats() {
    return await this.transactionApprovalService.getTransactionStats();
  }

  async getPaymentStats(startDate?: Date, endDate?: Date) {
    return await this.paymentProcessingService.getPaymentStats(startDate, endDate);
  }

  async getPaymentSummary(transactionId: string) {
    return await this.paymentProcessingService.getPaymentSummary(transactionId);
  }

  // Additional admin methods
  async getAllTransactions(page: number = 1, limit: number = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: whereClause,
      relations: ['brand', 'user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserTransactions(userId: string, page: number = 1, limit: number = 20) {
    return this.getTransactionHistory(userId, page, limit);
  }

  async getUserTransactionSummary(userId: string) {
    const balance = await this.getUserBalance(userId);
    const [transactions] = await this.transactionRepository.findAndCount({
      where: { userId },
      select: ['type', 'amount', 'status', 'createdAt'],
    });

    const summary = {
      userId,
      currentBalance: balance.balance,
      totalEarned: balance.totalEarned,
      totalRedeemed: balance.totalRedeemed,
      totalTransactions: transactions.length,
      pendingTransactions: transactions.filter(t => t.status === 'PENDING').length,
      approvedTransactions: transactions.filter(t => t.status === 'APPROVED').length,
      rejectedTransactions: transactions.filter(t => t.status === 'REJECTED').length,
    };

    return summary;
  }

  /**
   * Get all pending requests for a specific user
   */
  async getUserPendingRequests(userId: string) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId, status: 'PENDING' },
      relations: ['brand', 'user'],
      order: { createdAt: 'ASC' },
    });

    return {
      data: transactions,
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }

  /**
   * Get user details for verification form
   */
  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'paymentDetails'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Validate if user can have redeem request approved
   * User must have all pending earn requests verified before redeem approval
   */
  async canApproveRedeemRequest(userId: string): Promise<boolean> {
    const pendingEarnRequests = await this.transactionRepository.count({
      where: { userId, type: 'EARN', status: 'PENDING' },
    });

    return pendingEarnRequests === 0;
  }
}
