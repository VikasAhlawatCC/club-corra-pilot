#!/usr/bin/env ts-node

import { Client } from 'pg';

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface SampleTransaction {
  id: string;
  userId: string;
  brandId: string;
  type: 'EARN' | 'REDEEM';
  amount: number;
  billAmount: number;
  coinsEarned?: number;
  coinsRedeemed?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID';
  receiptUrl?: string;
  adminNotes?: string;
  billDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

async function addSampleTransactions() {
  console.log('🌱 Starting sample transaction seeding...');

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

    // Get existing users
    const usersResult = await client.query(`
      SELECT id, "mobileNumber" FROM users 
      WHERE status = 'ACTIVE' 
      LIMIT 5
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No active users found. Please create users first.');
      return;
    }

    console.log(`📱 Found ${usersResult.rows.length} active users`);

    // Get existing brands
    const brandsResult = await client.query(`
      SELECT id, name, "earningPercentage", "redemptionPercentage" 
      FROM brands 
      WHERE "isActive" = true 
      LIMIT 10
    `);

    if (brandsResult.rows.length === 0) {
      console.log('❌ No active brands found. Please create brands first.');
      return;
    }

    console.log(`🏪 Found ${brandsResult.rows.length} active brands`);

    // Sample transaction data
    const sampleTransactions: SampleTransaction[] = [];

    // Generate transactions for each user
    for (const user of usersResult.rows) {
      const userId = user.id;
      
      // Add 3-5 EARN transactions per user
      const earnCount = Math.floor(Math.random() * 3) + 3; // 3-5 transactions
      for (let i = 0; i < earnCount; i++) {
        const brand = brandsResult.rows[Math.floor(Math.random() * brandsResult.rows.length)];
        const billAmount = Math.floor(Math.random() * 5000) + 500; // ₹500 - ₹5500
        const earningPercentage = parseFloat(brand.earningPercentage);
        const coinsEarned = Math.round((billAmount * earningPercentage) / 100);
        
        // Random dates within last 30 days
        const billDate = new Date();
        billDate.setDate(billDate.getDate() - Math.floor(Math.random() * 30));
        
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7)); // Within last week
        
        sampleTransactions.push({
          id: generateUUID(),
          userId,
          brandId: brand.id,
          type: 'EARN',
          amount: coinsEarned,
          billAmount,
          coinsEarned,
          status: 'APPROVED', // Most earn transactions are approved
          receiptUrl: `https://example.com/receipts/earn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`,
          adminNotes: `Sample earn transaction for ${brand.name}`,
          billDate,
          createdAt,
          updatedAt: createdAt
        });
      }

      // Add 2-4 REDEEM transactions per user
      const redeemCount = Math.floor(Math.random() * 3) + 2; // 2-4 transactions
      for (let i = 0; i < redeemCount; i++) {
        const brand = brandsResult.rows[Math.floor(Math.random() * brandsResult.rows.length)];
        const billAmount = Math.floor(Math.random() * 3000) + 1000; // ₹1000 - ₹4000
        const redemptionPercentage = parseFloat(brand.redemptionPercentage);
        const maxRedemption = Math.min(
          billAmount * (redemptionPercentage / 100),
          parseFloat(brand.maxRedemptionAmount)
        );
        const coinsRedeemed = Math.min(
          Math.floor(Math.random() * maxRedemption) + 100,
          maxRedemption
        );
        
        // Random dates within last 30 days
        const billDate = new Date();
        billDate.setDate(billDate.getDate() - Math.floor(Math.random() * 30));
        
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7)); // Within last week
        
        // Mix of statuses for redeem transactions
        const statuses: Array<'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID'> = 
          ['PENDING', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        sampleTransactions.push({
          id: generateUUID(),
          userId,
          brandId: brand.id,
          type: 'REDEEM',
          amount: coinsRedeemed,
          billAmount,
          coinsRedeemed,
          status,
          receiptUrl: `https://example.com/receipts/redeem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`,
          adminNotes: status === 'REJECTED' ? 'Sample rejected transaction for testing' : `Sample redeem transaction for ${brand.name}`,
          billDate,
          createdAt,
          updatedAt: createdAt
        });
      }
    }

    console.log(`📊 Generated ${sampleTransactions.length} sample transactions`);

    // Insert transactions in batches
    const batchSize = 50;
    for (let i = 0; i < sampleTransactions.length; i += batchSize) {
      const batch = sampleTransactions.slice(i, i + batchSize);
      
      const values = batch.map((tx, index) => {
        const offset = index * 14; // 14 columns per transaction
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
      }).join(', ');

      const query = `
        INSERT INTO coin_transactions (
          id, "userId", "brandId", type, amount, "billAmount", "coinsEarned", 
          "coinsRedeemed", status, "receiptUrl", "adminNotes", "billDate", 
          "createdAt", "updatedAt"
        ) VALUES ${values}
        ON CONFLICT (id) DO NOTHING
      `;

      const params = batch.flatMap(tx => [
        tx.id, tx.userId, tx.brandId, tx.type, tx.amount, tx.billAmount,
        tx.coinsEarned, tx.coinsRedeemed, tx.status, tx.receiptUrl,
        tx.adminNotes, tx.billDate, tx.createdAt, tx.updatedAt
      ]);

      await client.query(query, params);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sampleTransactions.length / batchSize)}`);
    }

    // Verify the data
    const verifyResult = await client.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count,
        AVG("billAmount") as avg_bill_amount,
        AVG(amount) as avg_amount
      FROM coin_transactions 
      WHERE "createdAt" > NOW() - INTERVAL '1 day'
      GROUP BY type, status
      ORDER BY type, status
    `);

    console.log('\n📊 Verification Results:');
    verifyResult.rows.forEach(row => {
      console.log(`   ${row.type} - ${row.status}: ${row.count} transactions, Avg Bill: ₹${Math.round(row.avg_bill_amount)}, Avg Amount: ₹${Math.round(row.avg_amount)}`);
    });

    // Show some sample transactions
    const sampleResult = await client.query(`
      SELECT 
        ct.id,
        ct.type,
        ct.status,
        ct."billAmount",
        ct.amount,
        ct."billDate",
        ct."createdAt",
        u."mobileNumber",
        b.name as brand_name
      FROM coin_transactions ct
      JOIN users u ON ct."userId" = u.id
      LEFT JOIN brands b ON ct."brandId" = b.id
      WHERE ct."createdAt" > NOW() - INTERVAL '1 day'
      ORDER BY ct."createdAt" DESC
      LIMIT 10
    `);

    console.log('\n🔍 Sample Transactions:');
    sampleResult.rows.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${tx.brand_name || 'N/A'} - ₹${tx.billAmount} (${tx.status}) - User: ${tx.mobileNumber}`);
    });

    console.log('\n🎉 Sample transaction seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding sample transactions:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addSampleTransactions().catch(console.error);
