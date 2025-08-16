#!/usr/bin/env ts-node

import { Client } from 'pg';

async function debugBrands() {
  console.log('🔍 Debugging brands data...');

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

    // Check the actual table structure
    console.log('\n📋 Table structure:');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'brands' 
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    // Check a few brands with raw data
    console.log('\n🔍 Raw brand data (first 3 brands):');
    const rawBrands = await client.query(`
      SELECT id, name, "earningPercentage", "redemptionPercentage", "minRedemptionAmount", "maxRedemptionAmount", "isActive"
      FROM brands 
      ORDER BY name 
      LIMIT 3
    `);
    
    rawBrands.rows.forEach(brand => {
      console.log(`\n   Brand: ${brand.name}`);
      console.log(`   ID: ${brand.id}`);
      console.log(`   earningPercentage: ${brand.earningPercentage} (type: ${typeof brand.earningPercentage})`);
      console.log(`   redemptionPercentage: ${brand.redemptionPercentage} (type: ${typeof brand.redemptionPercentage})`);
      console.log(`   minRedemptionAmount: ${brand.minRedemptionAmount} (type: ${typeof brand.minRedemptionAmount})`);
      console.log(`   maxRedemptionAmount: ${brand.maxRedemptionAmount} (type: ${typeof brand.maxRedemptionAmount})`);
      console.log(`   isActive: ${brand.isActive}`);
    });

    // Check if there are any NULL values
    console.log('\n❓ Checking for NULL values:');
    const nullCheck = await client.query(`
      SELECT 
        COUNT(*) as total_brands,
        COUNT("earningPercentage") as brands_with_earning,
        COUNT("redemptionPercentage") as brands_with_redemption,
        COUNT("minRedemptionAmount") as brands_with_min_amount,
        COUNT("maxRedemptionAmount") as brands_with_max_amount
      FROM brands
    `);
    
    const stats = nullCheck.rows[0];
    console.log(`   Total brands: ${stats.total_brands}`);
    console.log(`   Brands with earning %: ${stats.brands_with_earning}`);
    console.log(`   Brands with redemption %: ${stats.brands_with_redemption}`);
    console.log(`   Brands with min amount: ${stats.brands_with_min_amount}`);
    console.log(`   Brands with max amount: ${stats.brands_with_max_amount}`);

    // Try to update one brand manually to see what happens
    console.log('\n🔧 Testing manual update...');
    const testUpdate = await client.query(`
      UPDATE brands 
      SET "earningPercentage" = 10.00, 
          "redemptionPercentage" = 30.00,
          "minRedemptionAmount" = 5.00,
          "maxRedemptionAmount" = 1000.00,
          "brandwiseMaxCap" = 1000.00
      WHERE name = 'Nike'
      RETURNING id, name, "earningPercentage", "redemptionPercentage"
    `);
    
    if (testUpdate.rows.length > 0) {
      const updated = testUpdate.rows[0];
      console.log(`   ✅ Updated Nike: earning=${updated.earningPercentage}%, redemption=${updated.redemptionPercentage}%`);
    } else {
      console.log('   ❌ Failed to update Nike');
    }
    
  } catch (error) {
    console.error('❌ Error debugging brands:', error);
    throw error;
  } finally {
    await client.end();
  }
}

debugBrands().catch(console.error);
