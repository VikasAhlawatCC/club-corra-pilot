const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'club_corra_db',
  user: 'club_corra_user',
  password: 'club_corra_password'
});

async function removeUser() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const targetMobile = '+918397070108';
    
    // First, get the user ID
    const userResult = await client.query('SELECT id FROM users WHERE "mobileNumber" = $1', [targetMobile]);
    
    if (userResult.rows.length === 0) {
      console.log('No user found with mobile number:', targetMobile);
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('Found user ID:', userId);
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Delete related records first (in order of dependencies)
      await client.query('DELETE FROM coin_transactions WHERE "userId" = $1', [userId]);
      console.log('Deleted coin transactions');
      
      await client.query('DELETE FROM coin_balances WHERE "userId" = $1', [userId]);
      console.log('Deleted coin balances');
      
      await client.query('DELETE FROM auth_providers WHERE "userId" = $1', [userId]);
      console.log('Deleted auth providers');
      
      await client.query('DELETE FROM user_profiles WHERE "userId" = $1', [userId]);
      console.log('Deleted user profile');
      
      await client.query('DELETE FROM payment_details WHERE "userId" = $1', [userId]);
      console.log('Deleted payment details');
      
      await client.query('DELETE FROM otps WHERE "identifier" = $1', [targetMobile]);
      console.log('Deleted OTPs');
      
      // Finally delete the user
      const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      console.log('Deleted user, rows affected:', deleteResult.rowCount);
      
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during deletion, rolling back:', error);
      throw error;
    }
    
    // Verify deletion
    const verifyResult = await client.query('SELECT id FROM users WHERE "mobileNumber" = $1', [targetMobile]);
    if (verifyResult.rows.length === 0) {
      console.log('✅ User successfully removed from database');
    } else {
      console.log('❌ User still exists in database');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

removeUser();
