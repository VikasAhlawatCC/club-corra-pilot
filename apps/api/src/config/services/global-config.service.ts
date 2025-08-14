import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalConfig } from '../entities/global-config.entity';

@Injectable()
export class GlobalConfigService {
  private readonly logger = new Logger(GlobalConfigService.name);
  private configCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(GlobalConfig)
    private readonly globalConfigRepository: Repository<GlobalConfig>,
  ) {}

  async getConfigValue(key: string, defaultValue?: any): Promise<any> {
    try {
      // Check cache first
      const cachedValue = this.getFromCache(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Get from database
      const config = await this.globalConfigRepository.findOne({
        where: { key },
      });

      if (!config) {
        this.logger.debug(`Config key not found: ${key}, using default: ${defaultValue}`);
        return defaultValue;
      }

      // Parse value based on type
      let value: any;
      switch (config.type) {
        case 'string':
          value = config.value;
          break;
        case 'number':
          value = parseFloat(config.value);
          break;
        case 'boolean':
          value = config.value.toLowerCase() === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(config.value);
          } catch (error) {
            this.logger.error(`Failed to parse JSON config ${key}: ${error.message}`);
            value = defaultValue;
          }
          break;
        default:
          value = config.value;
      }

      // Cache the value
      this.setCache(key, value);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get config value for ${key}: ${error.message}`);
      return defaultValue;
    }
  }

  async setConfigValue(key: string, value: string | number | boolean | object, type?: 'string' | 'number' | 'boolean' | 'json'): Promise<void> {
    try {
      // Determine type if not provided
      const configType = type || this.inferType(value);
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      await this.globalConfigRepository.upsert(
        {
          key,
          value: stringValue,
          type: configType,
          updatedAt: new Date(),
        },
        ['key'],
      );

      // Clear cache for this key
      this.clearCache(key);

      this.logger.log(`Config value updated: ${key} = ${stringValue}`);
    } catch (error) {
      this.logger.error(`Failed to set config value for ${key}: ${error.message}`);
      throw error;
    }
  }

  async getTransactionConfigs(): Promise<{
    minBillAmount: number;
    maxBillAgeDays: number;
    fraudPreventionHours: number;
    minTimeBetweenSubmissionsMinutes: number;
  }> {
    try {
      const [
        minBillAmount,
        maxBillAgeDays,
        fraudPreventionHours,
        minTimeBetweenSubmissionsMinutes,
      ] = await Promise.all([
        this.getConfigValue('MIN_BILL_AMOUNT', 100),
        this.getConfigValue('MAX_BILL_AGE_DAYS', 30),
        this.getConfigValue('FRAUD_PREVENTION_HOURS', 24),
        this.getConfigValue('MIN_TIME_BETWEEN_SUBMISSIONS_MINUTES', 5),
      ]);

      return {
        minBillAmount,
        maxBillAgeDays,
        fraudPreventionHours,
        minTimeBetweenSubmissionsMinutes,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction configs: ${error.message}`);
      // Return defaults
      return {
        minBillAmount: 100,
        maxBillAgeDays: 30,
        fraudPreventionHours: 24,
        minTimeBetweenSubmissionsMinutes: 5,
      };
    }
  }

  async getBrandConfigs(): Promise<{
    defaultEarningPercentage: number;
    defaultRedemptionPercentage: number;
    defaultOverallMaxCap: number;
    defaultBrandwiseMaxCap: number;
  }> {
    try {
      const [
        defaultEarningPercentage,
        defaultRedemptionPercentage,
        defaultOverallMaxCap,
        defaultBrandwiseMaxCap,
      ] = await Promise.all([
        this.getConfigValue('DEFAULT_EARNING_PERCENTAGE', 30),
        this.getConfigValue('DEFAULT_REDEMPTION_PERCENTAGE', 100),
        this.getConfigValue('DEFAULT_OVERALL_MAX_CAP', 2000),
        this.getConfigValue('DEFAULT_BRANDWISE_MAX_CAP', 2000),
      ]);

      return {
        defaultEarningPercentage,
        defaultRedemptionPercentage,
        defaultOverallMaxCap,
        defaultBrandwiseMaxCap,
      };
    } catch (error) {
      this.logger.error(`Failed to get brand configs: ${error.message}`);
      // Return defaults
      return {
        defaultEarningPercentage: 30,
        defaultRedemptionPercentage: 100,
        defaultOverallMaxCap: 2000,
        defaultBrandwiseMaxCap: 2000,
      };
    }
  }

  async getUserConfigs(): Promise<{
    welcomeBonusAmount: number;
    maxPendingRequests: number;
    minBalanceForRedemption: number;
  }> {
    try {
      const [
        welcomeBonusAmount,
        maxPendingRequests,
        minBalanceForRedemption,
      ] = await Promise.all([
        this.getConfigValue('WELCOME_BONUS_AMOUNT', 100),
        this.getConfigValue('MAX_PENDING_REQUESTS', 5),
        this.getConfigValue('MIN_BALANCE_FOR_REDEMPTION', 10),
      ]);

      return {
        welcomeBonusAmount,
        maxPendingRequests,
        minBalanceForRedemption,
      };
    } catch (error) {
      this.logger.error(`Failed to get user configs: ${error.message}`);
      // Return defaults
      return {
        welcomeBonusAmount: 100,
        maxPendingRequests: 5,
        minBalanceForRedemption: 10,
      };
    }
  }

  async getSecurityConfigs(): Promise<{
    jwtExpiryHours: number;
    refreshTokenExpiryDays: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
  }> {
    try {
      const [
        jwtExpiryHours,
        refreshTokenExpiryDays,
        maxLoginAttempts,
        lockoutDurationMinutes,
      ] = await Promise.all([
        this.getConfigValue('JWT_EXPIRY_HOURS', 24),
        this.getConfigValue('REFRESH_TOKEN_EXPIRY_DAYS', 30),
        this.getConfigValue('MAX_LOGIN_ATTEMPTS', 5),
        this.getConfigValue('LOCKOUT_DURATION_MINUTES', 15),
      ]);

      return {
        jwtExpiryHours,
        refreshTokenExpiryDays,
        maxLoginAttempts,
        lockoutDurationMinutes,
      };
    } catch (error) {
      this.logger.error(`Failed to get security configs: ${error.message}`);
      // Return defaults
      return {
        jwtExpiryHours: 24,
        refreshTokenExpiryDays: 30,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
      };
    }
  }

  async getAllConfigs(): Promise<GlobalConfig[]> {
    try {
      return await this.globalConfigRepository.find({
        order: { category: 'ASC', key: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to get all configs: ${error.message}`);
      throw error;
    }
  }

  async getConfigsByCategory(category: string): Promise<GlobalConfig[]> {
    try {
      return await this.globalConfigRepository.find({
        where: { category },
        order: { key: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to get configs by category ${category}: ${error.message}`);
      throw error;
    }
  }

  async deleteConfig(key: string): Promise<void> {
    try {
      await this.globalConfigRepository.delete({ key });
      this.clearCache(key);
      this.logger.log(`Config deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete config ${key}: ${error.message}`);
      throw error;
    }
  }

  private getFromCache(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      return null;
    }
    return this.configCache.get(key) || null;
  }

  private setCache(key: string, value: any): void {
    this.configCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private clearCache(key: string): void {
    this.configCache.delete(key);
    this.cacheExpiry.delete(key);
  }

  async clearAllCache(): Promise<void> {
    this.configCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('All config cache cleared');
  }

  async initializeDefaultConfigs(): Promise<void> {
    try {
      const defaultConfigs = [
        // Transaction configs
        { key: 'MIN_BILL_AMOUNT', value: '100', type: 'number' as const, category: 'transaction' },
        { key: 'MAX_BILL_AGE_DAYS', value: '30', type: 'number' as const, category: 'transaction' },
        { key: 'FRAUD_PREVENTION_HOURS', value: '24', type: 'number' as const, category: 'transaction' },
        { key: 'MIN_TIME_BETWEEN_SUBMISSIONS_MINUTES', value: '5', type: 'number' as const, category: 'transaction' },
        
        // Brand configs
        { key: 'DEFAULT_EARNING_PERCENTAGE', value: '30', type: 'number' as const, category: 'brand' },
        { key: 'DEFAULT_REDEMPTION_PERCENTAGE', value: '100', type: 'number' as const, category: 'brand' },
        { key: 'DEFAULT_OVERALL_MAX_CAP', value: '2000', type: 'number' as const, category: 'brand' },
        { key: 'DEFAULT_BRANDWISE_MAX_CAP', value: '2000', type: 'number' as const, category: 'brand' },
        
        // User configs
        { key: 'WELCOME_BONUS_AMOUNT', value: '100', type: 'number' as const, category: 'user' },
        { key: 'MAX_PENDING_REQUESTS', value: '5', type: 'number' as const, category: 'user' },
        { key: 'MIN_BALANCE_FOR_REDEMPTION', value: '10', type: 'number' as const, category: 'user' },
        
        // Security configs
        { key: 'JWT_EXPIRY_HOURS', value: '24', type: 'number' as const, category: 'security' },
        { key: 'REFRESH_TOKEN_EXPIRY_DAYS', value: '30', type: 'number' as const, category: 'security' },
        { key: 'MAX_LOGIN_ATTEMPTS', value: '5', type: 'number' as const, category: 'security' },
        { key: 'LOCKOUT_DURATION_MINUTES', value: '15', type: 'number' as const, category: 'security' },
      ];

      for (const config of defaultConfigs) {
        await this.globalConfigRepository.upsert(
          {
            ...config,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ['key'],
        );
      }

      this.logger.log('Default configs initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize default configs: ${error.message}`);
      throw error;
    }
  }

  private inferType(value: any): 'string' | 'number' | 'boolean' | 'json' {
    if (typeof value === 'string') {
      return 'string';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'object' && value !== null) {
      return 'json';
    }
    return 'string'; // Default to string if type cannot be inferred
  }
}
