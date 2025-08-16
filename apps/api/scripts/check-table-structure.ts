import { Client } from 'pg';

async function checkTableStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_e91RZvdAtrYG@ep-old-firefly-a1o93p6l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });

  try {
    await client.connect();
    console.log('Database connection established');

    // Check users table structure
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check user_profiles table structure
    console.log('\n=== USER_PROFILES TABLE STRUCTURE ===');
    const profilesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    
    profilesStructure.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check if there are any existing profiles
    console.log('\n=== EXISTING PROFILES ===');
    const existingProfiles = await client.query(`
      SELECT COUNT(*) as count FROM user_profiles
    `);
    console.log(`Total profiles: ${existingProfiles.rows[0].count}`);

    // Check total users
    console.log('\n=== TOTAL USERS ===');
    const totalUsers = await client.query(`
      SELECT COUNT(*) as count FROM users
    `);
    console.log(`Total users: ${totalUsers.rows[0].count}`);

    // Check users without profiles
    console.log('\n=== USERS WITHOUT PROFILES ===');
    const usersWithoutProfiles = await client.query(`
      SELECT COUNT(*) as count
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE up.id IS NULL
    `);
    console.log(`Users without profiles: ${usersWithoutProfiles.rows[0].count}`);

    // Check sample data
    console.log('\n=== SAMPLE USERS ===');
    const sampleUsers = await client.query(`
      SELECT id, "mobileNumber", status FROM users LIMIT 5
    `);
    sampleUsers.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.mobileNumber} - ${row.status}`);
    });

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkTableStructure().catch(console.error);
