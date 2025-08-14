import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { CoinBalance } from '../entities/coin-balance.entity';
// import { Brand } from '../../brands/entities/brand.entity';
import { GlobalConfigService } from '../../config/services/global-config.service';

export interface EarnRequestValidation {
  userId: string;
  brandId: string;
  billAmount: number;
  billDate: Date;
}

export interface RedeemRequestValidation {
  userId: string;
  brandId: string;
  billAmount: number;
  coinsToRedeem: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class TransactionValidationService {
  private readonly logger = new Logger(TransactionValidationService.name);

  constructor(
    @InjectRepository(CoinTransaction)
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
    @InjectRepository(CoinBalance)
    private readonly coinBalanceRepository: Repository<CoinBalance>,
    // @InjectRepository(Brand)
    // private readonly brandRepository: Repository<Brand>,
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  async validateEarnRequest(validation: EarnRequestValidation): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate bill amount
      const minBillAmount = await this.globalConfigService.getConfigValue('MIN_BILL_AMOUNT', 100);
      if (validation.billAmount < minBillAmount) {
        errors.push(`Bill amount must be at least ${minBillAmount}`);
      }

      // Validate bill date
      const now = new Date();
      if (validation.billDate > now) {
        errors.push('Bill date cannot be in the future');
      }

      // Validate bill age
      const maxBillAge = await this.globalConfigService.getConfigValue('MAX_BILL_AGE_DAYS', 30);
      const billAgeInDays = Math.floor((now.getTime() - validation.billDate.getTime()) / (1000 * 60 * 60 * 24));
      if (billAgeInDays > maxBillAge) {
        errors.push(`Bill is too old. Maximum age allowed is ${maxBillAge} days`);
      }

      // Check for duplicate submissions
      const recentSubmission = await this.coinTransactionRepository.findOne({
        where: {
          userId: validation.userId,
          brandId: validation.brandId,
          type: 'EARN',
          status: 'PENDING',
        },
        order: { createdAt: 'DESC' },
      });

      if (recentSubmission) {
        const timeSinceLastSubmission = Math.floor((now.getTime() - recentSubmission.createdAt.getTime()) / (1000 * 60));
        const minTimeBetweenSubmissions = await this.globalConfigService.getConfigValue('MIN_TIME_BETWEEN_SUBMISSIONS_MINUTES', 5);
        
        if (timeSinceLastSubmission < minTimeBetweenSubmissions) {
          errors.push(`Please wait ${minTimeBetweenSubmissions - timeSinceLastSubmission} minutes before submitting another request`);
        }
      }

      // Validate brand exists and is active
      // const brand = await this.brandRepository.findOne({ where: { id: validation.brandId } });
      // if (!brand) {
      //   errors.push('Brand not found');
      // } else if (!brand.isActive) {
      //   errors.push('Brand is not active');
      // }

      // Check brand earning caps
      // if (brand) {
      //   const userEarnedFromBrand = await this.coinTransactionRepository
      //     .createQueryBuilder('transaction')
      //     .select('SUM(transaction.coinsEarned)', 'totalEarned')
      //     .where('transaction.userId = :userId', { userId: validation.userId })
      //     .andWhere('transaction.brandId = :brandId', { brandId: validation.brandId })
      //     .andWhere('transaction.type = :type', { type: 'EARN' })
      //     .andWhere('transaction.status = :status', { status: 'APPROVED' })
      //     .getRawOne();

      //   const totalEarned = parseFloat(userEarnedFromBrand?.totalEarned || '0');
      //   const brandwiseMaxCap = brand.brandwiseMaxCap || 2000;

      //   if (totalEarned >= brandwiseMaxCap) {
      //     errors.push(`You have reached the maximum earning cap for this brand (${brandwiseMaxCap} coins)`);
      //   }

      //   // Check overall brand cap
      //   const overallBrandEarnings = await this.coinTransactionRepository
      //     .createQueryBuilder('transaction')
      //     .select('SUM(transaction.coinsEarned)', 'totalEarned')
      //     .where('transaction.brandId = :brandId', { brandId: validation.brandId })
      //     .andWhere('transaction.type = :type', { type: 'EARN' })
      //     .andWhere('transaction.status = :status', { status: 'APPROVED' })
      //     .getRawOne();

      //   const overallEarned = parseFloat(overallBrandEarnings?.totalEarned || '0');
      //   const overallMaxCap = brand.overallMaxCap || 2000;

      //   if (overallEarned >= overallMaxCap) {
      //     errors.push(`This brand has reached its overall earning cap (${overallMaxCap} coins)`);
      //   }
      // }

    } catch (error) {
      this.logger.error(`Error validating earn request: ${error.message}`);
      errors.push('Validation error occurred');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateRedeemRequest(validation: RedeemRequestValidation): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if user has sufficient balance
      const coinBalance = await this.coinBalanceRepository.findOne({ where: { userId: validation.userId } });
      if (!coinBalance || coinBalance.balance < validation.coinsToRedeem) {
        errors.push('Insufficient coin balance');
      }

      // Check if user has pending earn requests
      const pendingEarnRequests = await this.coinTransactionRepository.count({
        where: {
          userId: validation.userId,
          type: 'EARN',
          status: 'PENDING',
        },
      });

      if (pendingEarnRequests > 0) {
        errors.push('You have pending earn requests. Please wait for them to be processed before redeeming');
      }

      // Validate bill amount
      const minBillAmount = await this.globalConfigService.getConfigValue('MIN_BILL_AMOUNT', 100);
      if (validation.billAmount < minBillAmount) {
        errors.push(`Bill amount must be at least ${minBillAmount}`);
      }

      // Validate brand exists and is active
      // const brand = await this.brandRepository.findOne({ where: { id: validation.brandId } });
      // if (!brand) {
      //   errors.push('Brand not found');
      // } else if (!brand.isActive) {
      //   errors.push('Brand is not active');
      // }

      // Check brand redemption caps
      // if (brand) {
      //   const userRedeemedFromBrand = await this.coinTransactionRepository
      //     .createQueryBuilder('transaction')
      //     .select('SUM(transaction.coinsRedeemed)', 'totalRedeemed')
      //     .where('transaction.userId = :userId', { userId: validation.userId })
      //     .andWhere('transaction.brandId = :brandId', { brandId: validation.brandId })
      //     .where('transaction.type = :type', { type: 'REDEEM' })
      //     .andWhere('transaction.status = :status', { status: 'APPROVED' })
      //     .getRawOne();

      //   const totalRedeemed = parseFloat(userRedeemedFromBrand?.totalRedeemed || '0');
      //   const brandwiseMaxCap = brand.brandwiseMaxCap || 2000;

      //   if (totalRedeemed >= brandwiseMaxCap) {
      //     errors.push(`You have reached the maximum redemption cap for this brand (${brandwiseMaxCap} coins)`);
      //   }

      //   // Check overall brand cap
      //   const overallBrandRedemptions = await this.coinTransactionRepository
      //     .createQueryBuilder('transaction')
      //     .select('SUM(transaction.coinsRedeemed)', 'totalRedeemed')
      //     .where('transaction.brandId = :brandId', { brandId: validation.brandId })
      //     .where('transaction.type = :type', { type: 'REDEEM' })
      //     .select('transaction.status = :status', { status: 'APPROVED' })
      //     .getRawOne();

      //   const overallRedeemed = parseFloat(overallBrandRedemptions?.totalRedeemed || '0');
      //   const overallMaxCap = brand.overallMaxCap || 2000;

      //   if (overallRedeemed >= overallMaxCap) {
      //     errors.push(`This brand has reached its overall redemption cap (${overallMaxCap} coins)`);
      //   }

      //   // Validate redemption amount against brand percentage
      //   const maxRedemptionAmount = (validation.billAmount * brand.redemptionPercentage) / 100;
      //   if (validation.coinsToRedeem > maxRedemptionAmount) {
      //     errors.push(`Maximum redemption amount for this bill is ${maxRedemptionAmount} coins (${brand.redemptionPercentage}% of bill amount)`);
      //   }
      // }

    } catch (error) {
      this.logger.error(`Error validating redeem request: ${error.message}`);
      errors.push('Validation error occurred');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
