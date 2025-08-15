#!/usr/bin/env ts-node

import { Client } from 'pg';

async function addBrandsWithSQL() {
  console.log('🌱 Adding brands using raw SQL...');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'club_corra_user',
    password: 'club_corra_password',
    database: 'club_corra_db',
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully');

    // Check if we already have brands
    const existingBrandsResult = await client.query('SELECT COUNT(*) FROM brands');
    const existingBrandsCount = parseInt(existingBrandsResult.rows[0].count);
    
    if (existingBrandsCount > 0) {
      console.log(`📊 Found ${existingBrandsCount} existing brands, skipping...`);
      return;
    }

    // Get or create a basic category
    let categoryId: string;
    const categoryResult = await client.query('SELECT id FROM brand_categories WHERE name = $1', ['General']);
    
    if (categoryResult.rows.length === 0) {
      const insertCategoryResult = await client.query(
        'INSERT INTO brand_categories (name, description, icon, color) VALUES ($1, $2, $3, $4) RETURNING id',
        ['General', 'General brands and services', '🏪', '#636E72']
      );
      categoryId = insertCategoryResult.rows[0].id;
      console.log('✅ Created General category');
    } else {
      categoryId = categoryResult.rows[0].id;
      console.log('✅ Found existing General category');
    }

    // Add some basic brands
    const brands = [
      {
        name: 'Test Brand 1',
        description: 'A test brand for development purposes',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand1',
        earningPercentage: 5.00,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1000.00,
        brandwiseMaxCap: 1000.00,
      },
      {
        name: 'Test Brand 2',
        description: 'Another test brand for development',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand2',
        earningPercentage: 4.00,
        redemptionPercentage: 2.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
      },
      {
        name: 'Test Brand 3',
        description: 'Third test brand for development',
        logoUrl: 'https://via.placeholder.com/150x150?text=Brand3',
        earningPercentage: 6.00,
        redemptionPercentage: 4.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 600.00,
        brandwiseMaxCap: 600.00,
      },
      {
        name: 'Sample Restaurant',
        description: 'A sample restaurant for testing food transactions',
        logoUrl: 'https://via.placeholder.com/150x150?text=Restaurant',
        earningPercentage: 8.00,
        redemptionPercentage: 5.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 500.00,
        brandwiseMaxCap: 500.00,
      },
      {
        name: 'Sample Store',
        description: 'A sample retail store for testing shopping transactions',
        logoUrl: 'https://via.placeholder.com/150x150?text=Store',
        earningPercentage: 3.50,
        redemptionPercentage: 2.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 1200.00,
        brandwiseMaxCap: 1200.00,
      },
      {
        name: 'Coffee Shop',
        description: 'A local coffee shop for testing beverage transactions',
        logoUrl: 'https://via.placeholder.com/150x150?text=Coffee',
        earningPercentage: 7.00,
        redemptionPercentage: 4.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 400.00,
        brandwiseMaxCap: 400.00,
      },
      {
        name: 'Electronics Store',
        description: 'A sample electronics store for testing tech purchases',
        logoUrl: 'https://via.placeholder.com/150x150?text=Electronics',
        earningPercentage: 2.50,
        redemptionPercentage: 1.50,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 2000.00,
        brandwiseMaxCap: 2000.00,
      },
      {
        name: 'Fashion Boutique',
        description: 'A sample fashion store for testing clothing purchases',
        logoUrl: 'https://via.placeholder.com/150x150?text=Fashion',
        earningPercentage: 4.50,
        redemptionPercentage: 3.00,
        minRedemptionAmount: 1.00,
        maxRedemptionAmount: 800.00,
        brandwiseMaxCap: 800.00,
      },
    ];

    for (const brand of brands) {
      await client.query(
        `INSERT INTO brands (
          name, description, logo_url, category_id, 
          earning_percentage, redemption_percentage, 
          min_redemption_amount, max_redemption_amount, 
          brandwise_max_cap, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          brand.name,
          brand.description,
          brand.logoUrl,
          categoryId,
          brand.earningPercentage,
          brand.redemptionPercentage,
          brand.minRedemptionAmount,
          brand.maxRedemptionAmount,
          brand.brandwiseMaxCap,
          true
        ]
      );
    }

    console.log(`✅ Added ${brands.length} test brands successfully!`);
    
  } catch (error) {
    console.error('❌ Error adding brands:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addBrandsWithSQL().catch(console.error);
