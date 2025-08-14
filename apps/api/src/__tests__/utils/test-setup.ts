import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { Notification } from '../../notifications/notification.entity';
import { UserProfile } from '../../users/entities/user-profile.entity';
import { PaymentDetails } from '../../users/entities/payment-details.entity';
import { BrandCategory } from '../../brands/entities/brand-category.entity';
import { GlobalConfig } from '../../config/entities/global-config.entity';
import { TestDataFactory } from './test-factories';

export class TestSetup {
  private dataSource: DataSource;
  private testData: {
    users: User[];
    brands: Brand[];
    transactions: CoinTransaction[];
    balances: CoinBalance[];
    notifications: Notification[];
    profiles: UserProfile[];
    paymentDetails: PaymentDetails[];
    categories: BrandCategory[];
    configs: GlobalConfig[];
  } = {
    users: [],
    brands: [],
    transactions: [],
    balances: [],
    notifications: [],
    profiles: [],
    paymentDetails: [],
    categories: [],
    configs: [],
  };

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async clearAllTestData(): Promise<void> {
    try {
      // Clear data in reverse dependency order
      await this.dataSource.getRepository(Notification).clear();
      await this.dataSource.getRepository(CoinTransaction).clear();
      await this.dataSource.getRepository(CoinBalance).clear();
      await this.dataSource.getRepository(PaymentDetails).clear();
      await this.dataSource.getRepository(UserProfile).clear();
      await this.dataSource.getRepository(User).clear();
      await this.dataSource.getRepository(Brand).clear();
      await this.dataSource.getRepository(BrandCategory).clear();
      await this.dataSource.getRepository(GlobalConfig).clear();

      // Reset test data arrays
      this.testData = {
        users: [],
        brands: [],
        transactions: [],
        balances: [],
        notifications: [],
        profiles: [],
        paymentDetails: [],
        categories: [],
        configs: [],
      };

      console.log('All test data cleared successfully');
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }

  async setupBasicTestData(): Promise<{
    testUser: User;
    testBrand: Brand;
    testBalance: CoinBalance;
    testTransaction: CoinTransaction;
  }> {
    try {
      // Create brand category
      const category = await this.dataSource.getRepository(BrandCategory).save(
        TestDataFactory.createBrand({
          id: 'test-category-1',
          name: 'Test Category',
          description: 'Test category for testing',
        } as any)
      );
      this.testData.categories.push(category);

      // Create test user
      const user = await this.dataSource.getRepository(User).save(
        TestDataFactory.createUser({
          id: 'test-user-1',
          mobileNumber: '9876543210',
          email: 'test@example.com',
        })
      );
      this.testData.users.push(user);

      // Create user profile
      const profile = await this.dataSource.getRepository(UserProfile).save(
        TestDataFactory.createUserProfile({
          id: 'test-profile-1',
          userId: user.id,
          firstName: 'Test',
          lastName: 'User',
        })
      );
      this.testData.profiles.push(profile);

      // Create payment details
      const paymentDetails = await this.dataSource.getRepository(PaymentDetails).save(
        TestDataFactory.createPaymentDetails({
          id: 'test-payment-1',
          userId: user.id,
          upiId: 'test@upi',
        })
      );
      this.testData.paymentDetails.push(paymentDetails);

      // Create test brand
      const brand = await this.dataSource.getRepository(Brand).save(
        TestDataFactory.createBrand({
          id: 'test-brand-1',
          categoryId: category.id,
          name: 'Test Brand',
          description: 'Test brand for testing',
        })
      );
      this.testData.brands.push(brand);

      // Create coin balance
      const balance = await this.dataSource.getRepository(CoinBalance).save(
        TestDataFactory.createCoinBalance({
          id: 'test-balance-1',
          userId: user.id,
          balance: 500,
          totalEarned: 600,
          totalRedeemed: 100,
        })
      );
      this.testData.balances.push(balance);

      // Create test transaction
      const transaction = await this.dataSource.getRepository(CoinTransaction).save(
        TestDataFactory.createCoinTransaction({
          id: 'test-tx-1',
          userId: user.id,
          brandId: brand.id,
          type: 'EARN',
          amount: 300,
          billAmount: 1000,
          coinsEarned: 300,
          status: 'PENDING',
        })
      );
      this.testData.transactions.push(transaction);

      console.log('Basic test data setup completed');

      return {
        testUser: user,
        testBrand: brand,
        testBalance: balance,
        testTransaction: transaction,
      };
    } catch (error) {
      console.error('Error setting up basic test data:', error);
      throw error;
    }
  }

  async setupPerformanceTestData(transactionCount: number = 10000): Promise<void> {
    try {
      console.log(`Setting up performance test data with ${transactionCount} transactions...`);

      // Create bulk users
      const bulkUsers = TestDataFactory.createBulkUsers(100);
      const savedUsers = await this.dataSource.getRepository(User).save(bulkUsers);
      this.testData.users.push(...savedUsers);

      // Create bulk brands
      const bulkBrands = TestDataFactory.createBulkBrands(50);
      const savedBrands = await this.dataSource.getRepository(Brand).save(bulkBrands);
      this.testData.brands.push(...savedBrands);

      // Create bulk transactions
      const bulkTransactions = TestDataFactory.createBulkTransactions(transactionCount, {
        userId: savedUsers[0].id,
        brandId: savedBrands[0].id,
      });
      const savedTransactions = await this.dataSource.getRepository(CoinTransaction).save(bulkTransactions);
      this.testData.transactions.push(...savedTransactions);

      console.log(`Performance test data setup completed: ${savedTransactions.length} transactions created`);
    } catch (error) {
      console.error('Error setting up performance test data:', error);
      throw error;
    }
  }

  async setupSecurityTestData(): Promise<{
    testUser: User;
    testAdmin: User;
    testBrand: Brand;
  }> {
    try {
      // Create regular user
      const user = await this.dataSource.getRepository(User).save(
        TestDataFactory.createUser({
          id: 'security-test-user',
          mobileNumber: '9876543211',
          email: 'security-user@example.com',
          status: 'ACTIVE',
        })
      );
      this.testData.users.push(user);

      // Create admin user
      const admin = await this.dataSource.getRepository(User).save(
        TestDataFactory.createUser({
          id: 'security-test-admin',
          mobileNumber: '9876543212',
          email: 'admin@clubcorra.com',
          status: 'ACTIVE',
        })
      );
      this.testData.users.push(admin);

      // Create test brand
      const brand = await this.dataSource.getRepository(Brand).save(
        TestDataFactory.createBrand({
          id: 'security-test-brand',
          name: 'Security Test Brand',
          description: 'Brand for security testing',
        })
      );
      this.testData.brands.push(brand);

      console.log('Security test data setup completed');

      return { testUser: user, testAdmin: admin, testBrand: brand };
    } catch (error) {
      console.error('Error setting up security test data:', error);
      throw error;
    }
  }

  async setupRealTimeTestData(): Promise<{
    testUser: User;
    testBrand: Brand;
    testTransaction: CoinTransaction;
  }> {
    try {
      // Create test user
      const user = await this.dataSource.getRepository(User).save(
        TestDataFactory.createUser({
          id: 'realtime-test-user',
          mobileNumber: '9876543213',
          email: 'realtime@example.com',
        })
      );
      this.testData.users.push(user);

      // Create test brand
      const brand = await this.dataSource.getRepository(Brand).save(
        TestDataFactory.createBrand({
          id: 'realtime-test-brand',
          name: 'Real-time Test Brand',
          description: 'Brand for real-time testing',
        })
      );
      this.testData.brands.push(brand);

      // Create test transaction
      const transaction = await this.dataSource.getRepository(CoinTransaction).save(
        TestDataFactory.createCoinTransaction({
          id: 'realtime-test-tx',
          userId: user.id,
          brandId: brand.id,
          type: 'EARN',
          status: 'PENDING',
        })
      );
      this.testData.transactions.push(transaction);

      console.log('Real-time test data setup completed');

      return { testUser: user, testBrand: brand, testTransaction: transaction };
    } catch (error) {
      console.error('Error setting up real-time test data:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    await this.clearAllTestData();
  }

  // Getter methods for accessing test data
  get users(): User[] {
    return this.testData.users;
  }

  get brands(): Brand[] {
    return this.testData.brands;
  }

  get transactions(): CoinTransaction[] {
    return this.testData.transactions;
  }

  get balances(): CoinBalance[] {
    return this.testData.balances;
  }

  get notifications(): Notification[] {
    return this.testData.notifications;
  }
}

// Global test setup instance
let globalTestSetup: TestSetup;

export const getTestSetup = (dataSource: DataSource): TestSetup => {
  if (!globalTestSetup) {
    globalTestSetup = new TestSetup(dataSource);
  }
  return globalTestSetup;
};

export const clearGlobalTestSetup = (): void => {
  globalTestSetup = undefined as any;
};
