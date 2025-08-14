import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { UserProfile, Gender } from '../users/entities/user-profile.entity';
import { PaymentDetails } from '../users/entities/payment-details.entity';
import { AuthProvider, ProviderType } from '../users/entities/auth-provider.entity';
import { BrandCategory } from '../brands/entities/brand-category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { CoinBalance } from '../coins/entities/coin-balance.entity';
import { CoinTransaction } from '../coins/entities/coin-transaction.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoDataSeeder {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly paymentDetailsRepository: Repository<PaymentDetails>,
    private readonly authProviderRepository: Repository<AuthProvider>,
    private readonly brandCategoryRepository: Repository<BrandCategory>,
    private readonly brandRepository: Repository<Brand>,
    private readonly coinBalanceRepository: Repository<CoinBalance>,
    private readonly coinTransactionRepository: Repository<CoinTransaction>,
  ) {}

  async seed() {
    console.log('🌱 Starting demo data seeding...');

    try {
      // Seed brand categories
      const categories = await this.seedBrandCategories();
      console.log(`✅ Created ${categories.length} brand categories`);

      // Seed brands
      const brands = await this.seedBrands(categories);
      console.log(`✅ Created ${brands.length} brands`);

      // Seed users
      const users = await this.seedUsers();
      console.log(`✅ Created ${users.length} users`);

      // Seed coin balances
      await this.seedCoinBalances(users);
      console.log(`✅ Created coin balances for ${users.length} users`);

      // Seed sample transactions
      await this.seedSampleTransactions(users, brands);
      console.log(`✅ Created sample coin transactions`);

      console.log('🎉 Demo data seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding demo data:', error);
      throw error;
    }
  }

  private async seedBrandCategories(): Promise<BrandCategory[]> {
    const categories = [
      {
        name: 'Fashion & Apparel',
        description: 'Clothing, shoes, and fashion accessories',
        icon: '👕',
        color: '#FF6B6B',
      },
      {
        name: 'Electronics',
        description: 'Gadgets, phones, and electronic devices',
        icon: '📱',
        color: '#4ECDC4',
      },
      {
        name: 'Food & Beverages',
        description: 'Restaurants, cafes, and food delivery',
        icon: '🍕',
        color: '#45B7D1',
      },
      {
        name: 'Beauty & Wellness',
        description: 'Cosmetics, skincare, and wellness products',
        icon: '💄',
        color: '#96CEB4',
      },
      {
        name: 'Home & Lifestyle',
        description: 'Home decor, furniture, and lifestyle products',
        icon: '🏠',
        color: '#FFEAA7',
      },
      {
        name: 'Sports & Fitness',
        description: 'Sports equipment, gym memberships, and fitness',
        icon: '⚽',
        color: '#DDA0DD',
      },
    ];

    const createdCategories: BrandCategory[] = [];
    for (const categoryData of categories) {
      const category = this.brandCategoryRepository.create(categoryData);
      const savedCategory = await this.brandCategoryRepository.save(category);
      createdCategories.push(savedCategory);
    }

    return createdCategories;
  }

  private async seedBrands(categories: BrandCategory[]): Promise<Brand[]> {
    const brands = [
      // Fashion & Apparel
      {
        name: 'Nike',
        description: 'Just Do It. Leading sports and lifestyle brand.',
        logoUrl: 'https://example.com/nike-logo.png',
        categoryId: categories[0].id,
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
      },
      {
        name: 'Adidas',
        description: 'Impossible is Nothing. Premium sportswear and lifestyle.',
        logoUrl: 'https://example.com/adidas-logo.png',
        categoryId: categories[0].id,
        earningPercentage: 4.50,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
      },
      {
        name: 'Zara',
        description: 'Fast fashion for the modern lifestyle.',
        logoUrl: 'https://example.com/zara-logo.png',
        categoryId: categories[0].id,
        earningPercentage: 3.00,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 500.00,
        brandwiseMaxCap: 500.00,
      },

      // Electronics
      {
        name: 'Apple',
        description: 'Think Different. Premium technology and innovation.',
        logoUrl: 'https://example.com/apple-logo.png',
        categoryId: categories[1].id,
        earningPercentage: 2.00,
        redemptionPercentage: 1.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 2000.00,
        brandwiseMaxCap: 2000.00,
      },
      {
        name: 'Samsung',
        description: 'Do What You Can\'t. Leading electronics manufacturer.',
        logoUrl: 'https://example.com/samsung-logo.png',
        categoryId: categories[1].id,
        earningPercentage: 3.50,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1500.00,
        brandwiseMaxCap: 1500.00,
      },
      {
        name: 'Sony',
        description: 'Make.Believe. Premium audio and visual technology.',
        logoUrl: 'https://example.com/sony-logo.png',
        categoryId: categories[1].id,
        earningPercentage: 4.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1200.00,
        brandwiseMaxCap: 1200.00,
      },

      // Food & Beverages
      {
        name: 'Starbucks',
        description: 'To inspire and nurture the human spirit.',
        logoUrl: 'https://example.com/starbucks-logo.png',
        categoryId: categories[2].id,
        earningPercentage: 8.00,
        redemptionPercentage: 5.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 300.00,
        brandwiseMaxCap: 300.00,
      },
      {
        name: 'McDonald\'s',
        description: 'I\'m Lovin\' It. Global fast food chain.',
        logoUrl: 'https://example.com/mcdonalds-logo.png',
        categoryId: categories[2].id,
        earningPercentage: 6.00,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 400.00,
        brandwiseMaxCap: 400.00,
      },
      {
        name: 'Domino\'s',
        description: 'It\'s What We Do. Pizza delivery and takeaway.',
        logoUrl: 'https://example.com/dominos-logo.png',
        categoryId: categories[2].id,
        earningPercentage: 7.00,
        redemptionPercentage: 4.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 350.00,
        brandwiseMaxCap: 350.00,
      },

      // Beauty & Wellness
      {
        name: 'L\'Oreal',
        description: 'Because You\'re Worth It. Beauty and cosmetics.',
        logoUrl: 'https://example.com/loreal-logo.png',
        categoryId: categories[3].id,
        earningPercentage: 5.50,
        redemptionPercentage: 3.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
      },
      {
        name: 'Sephora',
        description: 'Beauty and personal care products.',
        logoUrl: 'https://example.com/sephora-logo.png',
        categoryId: categories[3].id,
        earningPercentage: 6.50,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 600.00,
        brandwiseMaxCap: 600.00,
      },

      // Home & Lifestyle
      {
        name: 'IKEA',
        description: 'Creating a better everyday life for many people.',
        logoUrl: 'https://example.com/ikea-logo.png',
        categoryId: categories[4].id,
        earningPercentage: 2.50,
        redemptionPercentage: 1.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 2000.00,
        brandwiseMaxCap: 2000.00,
      },
      {
        name: 'H&M Home',
        description: 'Fashion, quality and best price in a sustainable way.',
        logoUrl: 'https://example.com/hm-logo.png',
        categoryId: categories[4].id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
      },
    ];

    const createdBrands: Brand[] = [];
    for (const brandData of brands) {
      const brand = this.brandRepository.create(brandData);
      const savedBrand = await this.brandRepository.save(brand);
      createdBrands.push(savedBrand);
    }

    return createdBrands;
  }

  private async seedUsers(): Promise<User[]> {
    const users = [
      {
        mobileNumber: '+919876543210',
        email: 'john.doe@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          gender: Gender.MALE,
          profilePicture: 'https://example.com/john-profile.jpg',
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '400001',
        },
        paymentDetails: {
          upiId: 'john.doe@upi',
          mobileNumber: '+919876543210',
        },
        authProviders: [
          {
            provider: ProviderType.GOOGLE,
            providerUserId: 'google_123456',
            isActive: true,
          },
        ],
      },
      {
        mobileNumber: '+919876543211',
        email: 'jane.smith@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1992-08-22'),
          gender: Gender.FEMALE,
          profilePicture: 'https://example.com/jane-profile.jpg',
          street: '456 Oak Avenue',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          postalCode: '110001',
        },
        paymentDetails: {
          upiId: 'jane.smith@upi',
          mobileNumber: '+919876543211',
        },
        authProviders: [
          {
            provider: ProviderType.FACEBOOK,
            providerUserId: 'facebook_789012',
            isActive: true,
          },
        ],
      },
      {
        mobileNumber: '+919876543212',
        email: 'mike.wilson@example.com',
        status: UserStatus.ACTIVE,
        isMobileVerified: true,
        isEmailVerified: true,
        profile: {
          firstName: 'Mike',
          lastName: 'Wilson',
          dateOfBirth: new Date('1988-12-10'),
          gender: Gender.MALE,
          profilePicture: 'https://example.com/mike-profile.jpg',
          street: '789 Pine Road',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          postalCode: '560001',
        },
        paymentDetails: {
          upiId: 'mike.wilson@upi',
          mobileNumber: '+919876543212',
          preferredMethod: 'upi',
          isDefault: true,
        },
        authProviders: [
          {
            provider: ProviderType.GOOGLE, // Using Google as Apple is not in the enum
            providerUserId: 'apple_345678',
            isActive: true,
          },
        ],
      },
    ];

    const createdUsers: User[] = [];
    for (const userData of users) {
      const user = this.userRepository.create({
        mobileNumber: userData.mobileNumber,
        email: userData.email,
        status: userData.status,
        isMobileVerified: userData.isMobileVerified,
        isEmailVerified: userData.isEmailVerified,
      });

      const savedUser = await this.userRepository.save(user);

      // Create profile
      const profile = this.userProfileRepository.create({
        ...userData.profile,
        userId: savedUser.id,
      });
      await this.userProfileRepository.save(profile);

      // Create payment details
      const paymentDetails = this.paymentDetailsRepository.create({
        ...userData.paymentDetails,
        userId: savedUser.id,
      });
      await this.paymentDetailsRepository.save(paymentDetails);

      // Create auth providers
      for (const providerData of userData.authProviders) {
        const provider = this.authProviderRepository.create({
          ...providerData,
          userId: savedUser.id,
        });
        await this.authProviderRepository.save(provider);
      }

      createdUsers.push(savedUser);
    }

    return createdUsers;
  }

  private async seedCoinBalances(users: User[]): Promise<void> {
    for (const user of users) {
      const balance = this.coinBalanceRepository.create({
        userId: user.id,
        balance: Math.floor(Math.random() * 1000) + 100, // Random balance between 100-1100
        totalEarned: Math.floor(Math.random() * 800) + 200, // Random total earned
        totalRedeemed: Math.floor(Math.random() * 300), // Random total redeemed
        lastUpdated: new Date(),
      });
      await this.coinBalanceRepository.save(balance);
    }
  }

  private async seedSampleTransactions(users: User[], brands: Brand[]): Promise<void> {
    const transactionTypes = ['WELCOME_BONUS', 'EARN', 'REDEEM'] as const;
    
    for (const user of users) {
      // Create 3-5 sample transactions per user
      const numTransactions = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numTransactions; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        
        // Handle amount based on transaction type
        let amount: number;
        let billAmount: number;
        let coinsEarned: number;
        let coinsRedeemed: number;
        
        switch (type) {
          case 'WELCOME_BONUS':
            amount = Math.floor(Math.random() * 50) + 50; // 50-100 coins
            billAmount = 0;
            coinsEarned = amount;
            coinsRedeemed = 0;
            break;
          case 'EARN':
            amount = Math.floor(Math.random() * 100) + 10; // 10-110 coins
            billAmount = Math.floor(Math.random() * 1000) + 100; // 100-1100 bill amount
            coinsEarned = amount;
            coinsRedeemed = 0;
            break;
          case 'REDEEM':
            amount = Math.floor(Math.random() * 50) + 10; // 10-60 coins
            billAmount = Math.floor(Math.random() * 500) + 50; // 50-550 bill amount
            coinsEarned = 0;
            coinsRedeemed = amount;
            break;
          default:
            amount = Math.floor(Math.random() * 100) + 10;
            billAmount = Math.floor(Math.random() * 1000) + 100;
            coinsEarned = amount;
            coinsRedeemed = 0;
        }
        
        const transaction = this.coinTransactionRepository.create({
          userId: user.id,
          brandId: brand.id,
          type,
          amount,
          billAmount,
          coinsEarned,
          coinsRedeemed,
          status: 'APPROVED',
          processedAt: new Date(),
        });
        
        await this.coinTransactionRepository.save(transaction);
      }
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const seeder = new DemoDataSeeder(
    app.get(getRepositoryToken(User)),
    app.get(getRepositoryToken(UserProfile)),
    app.get(getRepositoryToken(PaymentDetails)),
    app.get(getRepositoryToken(AuthProvider)),
    app.get(getRepositoryToken(BrandCategory)),
    app.get(getRepositoryToken(Brand)),
    app.get(getRepositoryToken(CoinBalance)),
    app.get(getRepositoryToken(CoinTransaction)),
  );

  try {
    await seeder.seed();
    console.log('🎉 Demo data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
