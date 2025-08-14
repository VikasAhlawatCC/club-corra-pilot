import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CoinBalance } from '../entities/coin-balance.entity';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { WelcomeBonusRequest } from '@shared/schemas/coin.schema';

@Injectable()
export class WelcomeBonusService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CoinBalance)
    private readonly coinBalanceRepository: Repository<CoinBalance>,
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process welcome bonus for a new user
   * Awards 100 Corra Coins to new users who haven't received the bonus yet
   */
  async processWelcomeBonus(request: WelcomeBonusRequest) {
    const { userId, mobileNumber } = request;

    // Verify user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: userId, mobileNumber },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('User account is not active');
    }

    if (user.hasWelcomeBonusProcessed) {
      throw new ConflictException('Welcome bonus already processed for this user');
    }

    // Use transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create welcome bonus transaction
      const welcomeTransaction = this.coinTransactionRepository.create({
        userId,
        type: 'WELCOME_BONUS',
        amount: 100,
        coinsEarned: 100,
        status: 'APPROVED',
        processedAt: new Date(),
      });

      await queryRunner.manager.save(CoinTransaction, welcomeTransaction);

      // Get or create coin balance
      let coinBalance = await queryRunner.manager.findOne(CoinBalance, {
        where: { userId },
      });

      if (!coinBalance) {
        coinBalance = this.coinBalanceRepository.create({
          userId,
          balance: 100,
          totalEarned: 100,
          totalRedeemed: 0,
          lastUpdated: new Date(),
        });
      } else {
        coinBalance.balance += 100;
        coinBalance.totalEarned += 100;
        coinBalance.lastUpdated = new Date();
      }

      await queryRunner.manager.save(CoinBalance, coinBalance);

      // Mark user as having received welcome bonus
      user.hasWelcomeBonusProcessed = true;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Welcome bonus of 100 Corra Coins awarded successfully!',
        coinsAwarded: 100,
        newBalance: coinBalance.balance,
        transactionId: welcomeTransaction.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check if user is eligible for welcome bonus
   */
  async checkEligibility(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['hasWelcomeBonusProcessed', 'status'],
    });

    return user && user.status === 'ACTIVE' && !user.hasWelcomeBonusProcessed;
  }

  /**
   * Get welcome bonus amount (configurable)
   */
  getWelcomeBonusAmount(): number {
    return 100; // This could be made configurable via environment variables
  }
}
