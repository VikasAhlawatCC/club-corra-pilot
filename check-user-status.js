const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'club_corra_db',
  user: 'club_corra_user',
  password: 'club_corra_password'
});

async function checkUserStatus() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const targetMobile = '+918397070108';
    
    // Check if user exists
    const userResult = await client.query('SELECT * FROM users WHERE "mobileNumber" = $1', [targetMobile]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found with mobile number:', targetMobile);
      console.log('Status: USER_DOES_NOT_EXIST');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Mobile:', user.mobileNumber);
    console.log('  Email:', user.email);
    console.log('  Status:', user.status);
    console.log('  Created:', user.createdAt);
    console.log('  Updated:', user.updatedAt);
    
    // Check related records
    const profileResult = await client.query('SELECT * FROM user_profiles WHERE "userId" = $1', [user.id]);
    const authResult = await client.query('SELECT * FROM auth_providers WHERE "userId" = $1', [user.id]);
    const balanceResult = await client.query('SELECT * FROM coin_balances WHERE "userId" = $1', [user.id]);
    const transactionResult = await client.query('SELECT COUNT(*) as count FROM coin_transactions WHERE "userId" = $1', [user.id]);
    
    console.log('\n📊 Related Records:');
    console.log('  Profile records:', profileResult.rows.length);
    console.log('  Auth providers:', authResult.rows.length);
    console.log('  Coin balances:', balanceResult.rows.length);
    console.log('  Transactions:', transactionResult.rows[0].count);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkUserStatus();
