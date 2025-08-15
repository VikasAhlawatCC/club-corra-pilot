#!/usr/bin/env ts-node

import { Client } from 'pg';

async function checkBrandData() {
  console.log('🔍 Checking raw brand data...');

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

    // Check table structure
    console.log('\n📋 Table structure:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'brands' 
      ORDER BY ordinal_position
    `);
    
    structureResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // Check raw data for first few brands
    console.log('\n📊 Raw data for first 3 brands:');
    const rawDataResult = await client.query(`
      SELECT * FROM brands LIMIT 3
    `);
    
    rawDataResult.rows.forEach((brand, index) => {
      console.log(`\nBrand ${index + 1}:`);
      Object.entries(brand).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    });

    // Check if there are any brands with null percentages
    console.log('\n🔍 Checking for brands with null percentages:');
    const nullCheckResult = await client.query(`
      SELECT name, "earningPercentage", "redemptionPercentage", "minRedemptionAmount", "maxRedemptionAmount"
      FROM brands 
      WHERE "earningPercentage" IS NULL OR "redemptionPercentage" IS NULL
    `);
    
    if (nullCheckResult.rows.length > 0) {
      console.log(`Found ${nullCheckResult.rows.length} brands with null percentages:`);
      nullCheckResult.rows.forEach(brand => {
        console.log(`   ${brand.name}: earning=${brand.earningPercentage}, redemption=${brand.redemptionPercentage}`);
      });
    } else {
      console.log('✅ All brands have percentage data');
    }
    
  } catch (error) {
    console.error('❌ Error checking brand data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkBrandData().catch(console.error);
