import { Client } from 'pg';

async function testProfileUpdate() {
  const client = new Client({
    connectionString: 'postgresql://club_corra_user:club_corra_password@localhost:5432/club_corra_db',
  });

  try {
    await client.connect();
    console.log('Database connection established');

    // Check current state
    console.log('\n=== CURRENT STATE ===');
    const currentState = await client.query(`
      SELECT u.id, u."mobileNumber", u."profileId", up.id as profile_id, up."firstName", up."lastName"
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId" 
      WHERE u."mobileNumber" = '6666666666'
    `);
    
    currentState.rows.forEach(row => {
      console.log(`User: ${row.mobileNumber}, ProfileId: ${row.profileId}, Profile: ${row.firstName} ${row.lastName}`);
    });

    // Try to update the profileId manually
    const user = currentState.rows[0];
    if (user && user.profile_id) {
      console.log(`\nUpdating profileId for user ${user.mobileNumber} to ${user.profile_id}`);
      
      const updateResult = await client.query(`
        UPDATE users 
        SET "profileId" = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [user.profile_id, user.id]);

      console.log(`Update result: ${updateResult.rowCount} rows affected`);
    }

    // Check final state
    console.log('\n=== FINAL STATE ===');
    const finalState = await client.query(`
      SELECT u.id, u."mobileNumber", u."profileId", up.id as profile_id, up."firstName", up."lastName"
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId" 
      WHERE u."mobileNumber" = '6666666666'
    `);
    
    finalState.rows.forEach(row => {
      console.log(`User: ${row.mobileNumber}, ProfileId: ${row.profileId}, Profile: ${row.firstName} ${row.lastName}`);
    });

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

testProfileUpdate().catch(console.error);
