import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { CoinBalance } from '../coins/entities/coin-balance.entity';

@Controller('admin/users')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(CoinBalance)
    private coinBalanceRepository: Repository<CoinBalance>,
  ) {}

  // Test endpoint without authentication to verify data fetching works
  @Get('test')
  async testGetUsers() {
    try {
      const users = await this.userRepository.find({
        relations: ['profile', 'coinBalance'],
        order: { createdAt: 'DESC' },
        take: 5, // Limit to 5 users for testing
      });

      return {
        success: true,
        message: 'Test endpoint - Users retrieved successfully',
        data: users,
        count: users.length,
      };
    } catch (error) {
      this.logger.error('Test endpoint error:', error);
      return {
        success: false,
        message: 'Test endpoint - Failed to retrieve users',
        error: error.message,
        stack: error.stack,
      };
    }
  }

  @Get()
  // @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllUsers() {
    try {
      this.logger.log('🔍 Fetching all users...');
      
      // Use a more robust query with proper error handling
      const users = await this.userRepository.find({
        relations: ['profile', 'coinBalance'],
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`✅ Found ${users.length} users`);

      // Transform the data to ensure consistent format
      const transformedUsers = users.map(user => ({
        id: user.id,
        mobileNumber: user.mobileNumber,
        email: user.email,
        status: user.status,
        isMobileVerified: user.isMobileVerified,
        isEmailVerified: user.isEmailVerified,
        hasWelcomeBonusProcessed: user.hasWelcomeBonusProcessed,
        lastLoginAt: user.lastLoginAt,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile || null,
        coinBalance: user.coinBalance || null,
      }));

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: transformedUsers,
      };
    } catch (error) {
      this.logger.error('❌ Error fetching users:', error);
      this.logger.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      
      return {
        success: false,
        message: 'Failed to retrieve users',
        error: error.message,
        details: {
          code: error.code,
          detail: error.detail
        }
      };
    }
  }

  @Get('stats')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  async getUserStats() {
    try {
      this.logger.log('🔍 Fetching user statistics...');

      const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
        this.userRepository.count({ where: { status: UserStatus.PENDING } }),
      ]);

      // Get total coins across all users with proper error handling
      let totalCoins = 0;
      try {
        const totalCoinsResult = await this.userRepository
          .createQueryBuilder('user')
          .leftJoin('user.coinBalance', 'coinBalance')
          .select('COALESCE(SUM(CAST(coinBalance.balance AS DECIMAL)), 0)', 'totalCoins')
          .getRawOne();

        totalCoins = parseFloat(totalCoinsResult?.totalCoins || '0');
      } catch (coinError) {
        this.logger.warn('Failed to calculate total coins, defaulting to 0:', coinError.message);
        totalCoins = 0;
      }

      this.logger.log(`✅ User stats: Total=${totalUsers}, Active=${activeUsers}, Pending=${pendingUsers}, Coins=${totalCoins}`);

      return {
        success: true,
        message: 'User statistics retrieved successfully',
        data: {
          totalUsers,
          activeUsers,
          pendingUsers,
          totalCoins,
        },
      };
    } catch (error) {
      this.logger.error('❌ Error fetching user statistics:', error);
      return {
        success: false,
        message: 'Failed to retrieve user statistics',
        error: error.message,
      };
    }
  }
}
