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
    let balance = await this.balanceRepository.findOne({ where: { userId } });

    if (!balance) {
      // Create new balance record
      balance = this.balanceRepository.create({
        userId,
        balance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
      });
      await this.balanceRepository.save(balance);
    }

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
}
