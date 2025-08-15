#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BrandCategory } from '../src/brands/entities/brand-category.entity';
import { Brand } from '../src/brands/entities/brand.entity';

@Injectable()
export class DummyBrandSeeder {
  constructor(
    private readonly brandCategoryRepository: Repository<BrandCategory>,
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async seed() {
    console.log('🌱 Starting dummy brand seeding...');

    try {
      // Check if we already have categories, if not create them
      let categories = await this.brandCategoryRepository.find();
      
      if (categories.length === 0) {
        console.log('📂 No brand categories found, creating them first...');
        categories = await this.seedBrandCategories();
        console.log(`✅ Created ${categories.length} brand categories`);
      } else {
        console.log(`📂 Found ${categories.length} existing brand categories`);
      }

      // Check if we already have brands
      const existingBrands = await this.brandRepository.find();
      if (existingBrands.length > 0) {
        console.log(`📊 Found ${existingBrands.length} existing brands`);
        console.log('ℹ️  Skipping brand creation as brands already exist');
        return;
      }

      // Seed brands
      const brands = await this.seedBrands(categories);
      console.log(`✅ Created ${brands.length} brands`);

      console.log('🎉 Dummy brand seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding dummy brands:', error);
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
      {
        name: 'Automotive',
        description: 'Cars, bikes, and automotive services',
        icon: '🚗',
        color: '#FF8C42',
      },
      {
        name: 'Travel & Hospitality',
        description: 'Hotels, flights, and travel services',
        icon: '✈️',
        color: '#74B9FF',
      },
      {
        name: 'Healthcare',
        description: 'Medical services, pharmacies, and wellness',
        icon: '🏥',
        color: '#A29BFE',
      },
      {
        name: 'Education',
        description: 'Schools, courses, and educational services',
        icon: '📚',
        color: '#FD79A8',
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
      {
        name: 'H&M',
        description: 'Fashion and quality at the best price.',
        logoUrl: 'https://example.com/hm-logo.png',
        categoryId: categories[0].id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 600.00,
        brandwiseMaxCap: 600.00,
        isActive: true,
      },
      {
        name: 'Uniqlo',
        description: 'Simple, high-quality clothing for everyone.',
        logoUrl: 'https://example.com/uniqlo-logo.png',
        categoryId: categories[0].id,
        earningPercentage: 3.50,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 400.00,
        brandwiseMaxCap: 400.00,
        isActive: true,
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
      {
        name: 'LG',
        description: 'Life\'s Good. Quality electronics and appliances.',
        logoUrl: 'https://example.com/lg-logo.png',
        categoryId: categories[1].id,
        earningPercentage: 3.00,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
        isActive: true,
      },
      {
        name: 'OnePlus',
        description: 'Never Settle. Premium smartphones and accessories.',
        logoUrl: 'https://example.com/oneplus-logo.png',
        categoryId: categories[1].id,
        earningPercentage: 4.50,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
        isActive: true,
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
      {
        name: 'KFC',
        description: 'It\'s Finger Lickin\' Good. Fried chicken and fast food.',
        logoUrl: 'https://example.com/kfc-logo.png',
        categoryId: categories[2].id,
        earningPercentage: 6.50,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 450.00,
        brandwiseMaxCap: 450.00,
        isActive: true,
      },
      {
        name: 'Pizza Hut',
        description: 'Pizza Pizza! Pizza, pasta, and Italian cuisine.',
        logoUrl: 'https://example.com/pizzahut-logo.png',
        categoryId: categories[2].id,
        earningPercentage: 7.50,
        redemptionPercentage: 5.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 400.00,
        brandwiseMaxCap: 400.00,
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
      {
        name: 'MAC Cosmetics',
        description: 'All Ages, All Races, All Sexes. Professional makeup.',
        logoUrl: 'https://example.com/mac-logo.png',
        categoryId: categories[3].id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
        isActive: true,
      },
      {
        name: 'The Body Shop',
        description: 'Enrich not Exploit. Natural beauty products.',
        logoUrl: 'https://example.com/bodyshop-logo.png',
        categoryId: categories[3].id,
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 700.00,
        brandwiseMaxCap: 700.00,
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
      {
        name: 'West Elm',
        description: 'Modern furniture and home decor.',
        logoUrl: 'https://example.com/westelm-logo.png',
        categoryId: categories[4].id,
        earningPercentage: 3.00,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1500.00,
        brandwiseMaxCap: 1500.00,
        isActive: true,
      },

      // Sports & Fitness
      {
        name: 'Decathlon',
        description: 'Sports equipment for all levels.',
        logoUrl: 'https://example.com/decathlon-logo.png',
        categoryId: categories[5].id,
        earningPercentage: 6.00,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
        isActive: true,
      },
      {
        name: 'Planet Fitness',
        description: 'Judgement Free Zone. Affordable gym memberships.',
        logoUrl: 'https://example.com/planetfitness-logo.png',
        categoryId: categories[5].id,
        earningPercentage: 8.00,
        redemptionPercentage: 5.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 500.00,
        brandwiseMaxCap: 500.00,
        isActive: true,
      },
      {
        name: 'Under Armour',
        description: 'The Only Way Is Through. Performance athletic wear.',
        logoUrl: 'https://example.com/underarmour-logo.png',
        categoryId: categories[5].id,
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 900.00,
        brandwiseMaxCap: 900.00,
        isActive: true,
      },

      // Automotive
      {
        name: 'Shell',
        description: 'Go Well. Fuel stations and convenience stores.',
        logoUrl: 'https://example.com/shell-logo.png',
        categoryId: categories[6].id,
        earningPercentage: 3.00,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
        isActive: true,
      },
      {
        name: 'BP',
        description: 'Beyond Petroleum. Energy and mobility solutions.',
        logoUrl: 'https://example.com/bp-logo.png',
        categoryId: categories[6].id,
        earningPercentage: 3.50,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
        isActive: true,
      },

      // Travel & Hospitality
      {
        name: 'Marriott',
        description: 'Travel Brilliantly. Luxury hotels and resorts.',
        logoUrl: 'https://example.com/marriott-logo.png',
        categoryId: categories[7].id,
        earningPercentage: 2.00,
        redemptionPercentage: 1.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 2000.00,
        brandwiseMaxCap: 2000.00,
        isActive: true,
      },
      {
        name: 'Airbnb',
        description: 'Belong Anywhere. Unique accommodations worldwide.',
        logoUrl: 'https://example.com/airbnb-logo.png',
        categoryId: categories[7].id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1500.00,
        brandwiseMaxCap: 1500.00,
        isActive: true,
      },

      // Healthcare
      {
        name: 'CVS Pharmacy',
        description: 'Health is Everything. Pharmacy and health services.',
        logoUrl: 'https://example.com/cvs-logo.png',
        categoryId: categories[8].id,
        earningPercentage: 4.50,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 600.00,
        brandwiseMaxCap: 600.00,
        isActive: true,
      },
      {
        name: 'Walgreens',
        description: 'At the Corner of Happy & Healthy. Pharmacy chain.',
        logoUrl: 'https://example.com/walgreens-logo.png',
        categoryId: categories[8].id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 700.00,
        brandwiseMaxCap: 700.00,
        isActive: true,
      },

      // Education
      {
        name: 'Coursera',
        description: 'Learn Without Limits. Online courses and degrees.',
        logoUrl: 'https://example.com/coursera-logo.png',
        categoryId: categories[9].id,
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
        isActive: true,
      },
      {
        name: 'Udemy',
        description: 'Learn anything, anywhere. Online learning platform.',
        logoUrl: 'https://example.com/udemy-logo.png',
        categoryId: categories[9].id,
        earningPercentage: 6.00,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
        isActive: true,
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
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const seeder = new DummyBrandSeeder(
    app.get(getRepositoryToken(BrandCategory)),
    app.get(getRepositoryToken(Brand)),
  );

  try {
    await seeder.seed();
    console.log('🎉 Dummy brand seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding dummy brands:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
