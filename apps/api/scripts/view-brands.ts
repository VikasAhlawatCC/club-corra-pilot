#!/usr/bin/env ts-node

import { Client } from 'pg';

async function viewBrands() {
  console.log('🔍 Viewing existing brands...');

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

    // Get all brands with their categories
    const result = await client.query(`
      SELECT 
        b.name, 
        b.description, 
        b."earningPercentage", 
        b."redemptionPercentage",
        b."minRedemptionAmount",
        b."maxRedemptionAmount",
        bc.name as category_name
      FROM brands b
      LEFT JOIN brand_categories bc ON b."categoryId" = bc.id
      ORDER BY b.name
    `);

    console.log(`\n📊 Found ${result.rows.length} brands:\n`);
    
    result.rows.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name}`);
      console.log(`   Category: ${brand.category_name || 'N/A'}`);
      console.log(`   Description: ${brand.description}`);
      console.log(`   Earning: ${brand.earning_percentage}% | Redemption: ${brand.redemption_percentage}%`);
      console.log(`   Min/Max Redemption: $${brand.min_redemption_amount} - $${brand.max_redemption_amount}`);
      console.log('');
    });

    // Also show categories
    const categoriesResult = await client.query('SELECT name, description, icon, color FROM brand_categories ORDER BY name');
    console.log(`\n📂 Found ${categoriesResult.rows.length} categories:\n`);
    
    categoriesResult.rows.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} ${category.icon}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   Color: ${category.color}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error viewing brands:', error);
    throw error;
  } finally {
    await client.end();
  }
}

viewBrands().catch(console.error);
