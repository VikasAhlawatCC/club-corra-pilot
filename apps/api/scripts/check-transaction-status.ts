#!/usr/bin/env ts-node

import { Client } from 'pg';

async function checkTransactionStatus() {
  console.log('🔍 Checking transaction status and pending requests...');

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

    // Check total transaction counts by type and status
    console.log('\n📊 Transaction Summary by Type and Status:');
    const summaryResult = await client.query(`
      SELECT 
        type,
        status,
        COUNT(*) as count,
        AVG("billAmount") as avg_bill_amount,
        AVG(amount) as avg_amount
      FROM coin_transactions 
      GROUP BY type, status
      ORDER BY type, status
    `);
    
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.type} - ${row.status}: ${row.count} transactions, Avg Bill: ₹${Math.round(row.avg_bill_amount || 0)}, Avg Amount: ₹${Math.round(row.avg_amount || 0)}`);
    });

    // Check users with multiple pending requests
    console.log('\n👥 Users with Multiple Pending Requests:');
    const pendingRequestsResult = await client.query(`
      SELECT 
        u."mobileNumber",
        COUNT(*) as pending_count
      FROM coin_transactions ct
      JOIN users u ON ct."userId" = u.id
      WHERE ct.status = 'PENDING'
      GROUP BY u.id, u."mobileNumber"
      HAVING COUNT(*) > 1
      ORDER BY pending_count DESC
    `);
    
    if (pendingRequestsResult.rows.length > 0) {
      pendingRequestsResult.rows.forEach(row => {
        console.log(`   ${row.mobileNumber}: ${row.pending_count} pending requests`);
      });
    } else {
      console.log('   No users with multiple pending requests found');
    }

    // Check users with multiple requests of any status
    console.log('\n👥 Users with Multiple Requests (Any Status):');
    const multipleRequestsResult = await client.query(`
      SELECT 
        u."mobileNumber",
        COUNT(*) as total_count,
        COUNT(CASE WHEN ct.status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN ct.status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN ct.status = 'REJECTED' THEN 1 END) as rejected_count
      FROM coin_transactions ct
      JOIN users u ON ct."userId" = u.id
      GROUP BY u.id, u."mobileNumber"
      HAVING COUNT(*) > 1
      ORDER BY total_count DESC
    `);
    
    multipleRequestsResult.rows.forEach(row => {
      console.log(`   ${row.mobileNumber}: ${row.total_count} total requests (${row.pending_count} pending, ${row.approved_count} approved, ${row.rejected_count} rejected)`);
    });

    // Show recent transactions for verification
    console.log('\n🔍 Recent Transactions (Last 10):');
    const recentResult = await client.query(`
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
      ORDER BY ct."createdAt" DESC
      LIMIT 10
    `);

    recentResult.rows.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${tx.brand_name || 'N/A'} - ₹${tx.billAmount || 0} (${tx.status}) - User: ${tx.mobileNumber} - ${tx.createdAt.toLocaleDateString()}`);
    });

    // Check if there are enough pending transactions for testing
    const pendingCountResult = await client.query(`
      SELECT COUNT(*) as pending_count FROM coin_transactions WHERE status = 'PENDING'
    `);
    
    console.log(`\n📋 Total Pending Transactions: ${pendingCountResult.rows[0].pending_count}`);
    
    if (parseInt(pendingCountResult.rows[0].pending_count) >= 5) {
      console.log('✅ Sufficient pending transactions for testing TransactionVerificationModal');
    } else {
      console.log('⚠️  Need more pending transactions for comprehensive testing');
    }

  } catch (error) {
    console.error('❌ Error checking transaction status:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkTransactionStatus().catch(console.error);
