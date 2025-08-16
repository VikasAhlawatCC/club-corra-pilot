#!/usr/bin/env ts-node

import { Client } from 'pg';

async function checkTransactionSchema() {
  console.log('🔍 Checking coin_transactions table schema...');

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
      WHERE table_name = 'coin_transactions' 
      ORDER BY ordinal_position
    `);
    
    structureResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // Check if table has any data
    console.log('\n📊 Table data count:');
    const countResult = await client.query(`
      SELECT COUNT(*) as total_count FROM coin_transactions
    `);
    console.log(`   Total transactions: ${countResult.rows[0].total_count}`);

    // Check sample data if any exists
    if (parseInt(countResult.rows[0].total_count) > 0) {
      console.log('\n🔍 Sample data (first 3 rows):');
      const sampleResult = await client.query(`
        SELECT * FROM coin_transactions LIMIT 3
      `);
      
      sampleResult.rows.forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    }

    // Check enum types
    console.log('\n🔤 Enum types:');
    const enumResult = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%coin_transactions%'
      ORDER BY t.typname, e.enumsortorder
    `);
    
    if (enumResult.rows.length > 0) {
      const groupedEnums = enumResult.rows.reduce((acc, row) => {
        if (!acc[row.typname]) acc[row.typname] = [];
        acc[row.typname].push(row.enumlabel);
        return acc;
      }, {});
      
      Object.entries(groupedEnums).forEach(([typeName, values]) => {
        console.log(`   ${typeName}: [${(values as string[]).join(', ')}]`);
      });
    } else {
      console.log('   No enum types found');
    }

  } catch (error) {
    console.error('❌ Error checking transaction schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkTransactionSchema().catch(console.error);
