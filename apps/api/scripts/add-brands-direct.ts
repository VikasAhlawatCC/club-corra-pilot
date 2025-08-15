#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import { BrandCategory } from '../src/brands/entities/brand-category.entity';
import { Brand } from '../src/brands/entities/brand.entity';
import { CoinTransaction } from '../src/coins/entities/coin-transaction.entity';

async function addBrandsDirect() {
  console.log('🌱 Adding brands directly to database...');

  // Create a direct database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'club_corra_user',
    password: 'club_corra_password',
    database: 'club_corra_db',
    entities: [BrandCategory, Brand, CoinTransaction],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    const brandCategoryRepo = dataSource.getRepository(BrandCategory);
    const brandRepo = dataSource.getRepository(Brand);

    // Check if we already have brands
    const existingBrands = await brandRepo.find();
    if (existingBrands.length > 0) {
      console.log(`📊 Found ${existingBrands.length} existing brands, skipping...`);
      return;
    }

    // Get or create a basic category
    let category = await brandCategoryRepo.findOne({ where: { name: 'General' } });
    if (!category) {
      category = brandCategoryRepo.create({
        name: 'General',
        description: 'General brands and services',
        icon: '🏪',
        color: '#636E72',
      });
      category = await brandCategoryRepo.save(category);
      console.log('✅ Created General category');
    }

    // Add some basic brands
    const brands = [
      {
        name: 'Test Brand 1',
        description: 'A test brand for development purposes',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand1',
        categoryId: category.id,
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
        isActive: true,
      },
      {
        name: 'Test Brand 2',
        description: 'Another test brand for development',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand2',
        categoryId: category.id,
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
        isActive: true,
      },
      {
        name: 'Test Brand 3',
        description: 'Third test brand for development',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand3',
        categoryId: category.id,
        earningPercentage: 6.00,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 600.00,
        brandwiseMaxCap: 600.00,
        isActive: true,
      },
      {
        name: 'Sample Restaurant',
        description: 'A sample restaurant for testing food transactions',
        logoUrl: 'https://via.placeholder.com/150x150?text=Restaurant',
        categoryId: category.id,
        earningPercentage: 8.00,
        redemptionPercentage: 5.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 500.00,
        brandwiseMaxCap: 500.00,
        isActive: true,
      },
      {
        name: 'Sample Store',
        description: 'A sample retail store for testing shopping transactions',
        logoUrl: 'https://via.placeholder.com/150x150?text=Store',
        categoryId: category.id,
        earningPercentage: 3.50,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1200.00,
        brandwiseMaxCap: 1200.00,
        isActive: true,
      },
    ];

    for (const brandData of brands) {
      const brand = brandRepo.create(brandData);
      await brandRepo.save(brand);
    }

    console.log(`✅ Added ${brands.length} test brands successfully!`);
    
  } catch (error) {
    console.error('❌ Error adding brands:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

addBrandsDirect().catch(console.error);
