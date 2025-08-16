#!/usr/bin/env ts-node

import { Client } from 'pg';

async function fixExistingBrands() {
  console.log('🔧 Fixing existing brands with proper data...');

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

    // Get all existing brands
    const brandsResult = await client.query('SELECT id, name FROM brands');
    const existingBrands = brandsResult.rows;
    console.log(`📊 Found ${existingBrands.length} existing brands`);

    if (existingBrands.length === 0) {
      console.log('❌ No brands found to fix');
      return;
    }

    // Define brand configurations with realistic percentages and amounts
    const brandConfigs = {
      'Adidas': { earning: 8.0, redemption: 25.0, minAmount: 5.0, maxAmount: 1500.0 },
      'Apple': { earning: 12.0, redemption: 35.0, minAmount: 10.0, maxAmount: 3000.0 },
      'Domino\'s': { earning: 6.0, redemption: 20.0, minAmount: 3.0, maxAmount: 800.0 },
      'H&M Home': { earning: 7.0, redemption: 22.0, minAmount: 5.0, maxAmount: 1200.0 },
      'IKEA': { earning: 9.0, redemption: 28.0, minAmount: 8.0, maxAmount: 2000.0 },
      'L\'Oreal': { earning: 10.0, redemption: 30.0, minAmount: 5.0, maxAmount: 1000.0 },
      'McDonald\'s': { earning: 5.0, redemption: 18.0, minAmount: 2.0, maxAmount: 500.0 },
      'Nike': { earning: 8.0, redemption: 25.0, minAmount: 5.0, maxAmount: 1500.0 },
      'Samsung': { earning: 11.0, redemption: 32.0, minAmount: 8.0, maxAmount: 2500.0 },
      'Sephora': { earning: 9.0, redemption: 28.0, minAmount: 5.0, maxAmount: 1200.0 },
      'Sony': { earning: 10.0, redemption: 30.0, minAmount: 8.0, maxAmount: 2000.0 },
      'Starbucks': { earning: 6.0, redemption: 20.0, minAmount: 3.0, maxAmount: 600.0 },
      'Zara': { earning: 7.0, redemption: 22.0, minAmount: 5.0, maxAmount: 1000.0 },
    };

    let updatedCount = 0;
    let skippedCount = 0;

    for (const brand of existingBrands) {
      const config = brandConfigs[brand.name];
      
      if (!config) {
        console.log(`⚠️  No config found for brand: ${brand.name}, skipping...`);
        skippedCount++;
        continue;
      }

      // Check if brand already has proper data
      const checkResult = await client.query(
        'SELECT "earningPercentage", "redemptionPercentage", "minRedemptionAmount", "maxRedemptionAmount" FROM brands WHERE id = $1',
        [brand.id]
      );
      
      const brandData = checkResult.rows[0];
      if (brandData.earningPercentage && brandData.redemptionPercentage && 
          brandData.minRedemptionAmount && brandData.maxRedemptionAmount) {
        console.log(`✅ Brand ${brand.name} already has proper data, skipping...`);
        skippedCount++;
        continue;
      }

      // Update brand with proper data
      try {
        await client.query(
          `UPDATE brands SET 
            "earningPercentage" = $1, 
            "redemptionPercentage" = $2, 
            "minRedemptionAmount" = $3, 
            "maxRedemptionAmount" = $4, 
            "brandwiseMaxCap" = $4,
            "isActive" = true,
            "updatedAt" = NOW()
           WHERE id = $5`,
          [config.earning, config.redemption, config.minAmount, config.maxAmount, brand.id]
        );
        
        console.log(`✅ Updated ${brand.name}: ${config.earning}% earn, ${config.redemption}% redeem, $${config.minAmount}-$${config.maxAmount}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${brand.name}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} brands`);
    console.log(`   ⏭️  Skipped: ${skippedCount} brands`);
    console.log(`   📱 Total: ${existingBrands.length} brands`);

    if (updatedCount > 0) {
      console.log(`\n🎉 Successfully fixed ${updatedCount} brands! They should now appear on the mobile app.`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing brands:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixExistingBrands().catch(console.error);
