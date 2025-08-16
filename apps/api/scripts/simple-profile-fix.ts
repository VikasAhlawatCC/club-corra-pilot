import { Client } from 'pg';

async function fixUserProfilesSimple() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_e91RZvdAtrYG@ep-old-firefly-a1o93p6l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });

  try {
    await client.connect();
    console.log('Database connection established');

    // Check current state
    const checkResult = await client.query(`
      SELECT 
        u.id, 
        u."mobileNumber", 
        u.status,
        up.id as profile_id,
        up."firstName",
        up."lastName"
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId"
      ORDER BY u."createdAt" DESC 
      LIMIT 10
    `);

    console.log('\n=== CURRENT STATE ===');
    checkResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.mobileNumber} - ${row.status} - ${row.profile_id ? `${row.firstName} ${row.lastName}` : 'NO PROFILE'}`);
    });

    // Find users without profiles
    const usersWithoutProfiles = await client.query(`
      SELECT u.id, u."mobileNumber"
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE up.id IS NULL
    `);

    console.log(`\nFound ${usersWithoutProfiles.rows.length} users without profiles`);

    // Create profiles for users without them
    for (const user of usersWithoutProfiles.rows) {
      console.log(`\nProcessing user: ${user.mobileNumber} (${user.id})`);
      
      try {
        // Create profile
        const profileResult = await client.query(`
          INSERT INTO user_profiles ("firstName", "lastName", "userId", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id, "firstName", "lastName"
        `, ['User', user.mobileNumber.slice(-4), user.id]);

        const profile = profileResult.rows[0];
        console.log(`✅ Created profile: ${profile.firstName} ${profile.lastName}`);

        // Update user to link to profile
        await client.query(`
          UPDATE users 
          SET "profileId" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [profile.id, user.id]);

        console.log(`✅ Updated user to link to profile`);
        
      } catch (error) {
        console.error(`❌ Failed to create profile for user ${user.mobileNumber}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Verify the fix
    const finalCheck = await client.query(`
      SELECT 
        u.id, 
        u."mobileNumber", 
        u.status,
        up.id as profile_id,
        up."firstName",
        up."lastName"
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up."userId"
      ORDER BY u."createdAt" DESC 
      LIMIT 10
    `);

    console.log('\n=== FINAL STATE ===');
    finalCheck.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.mobileNumber} - ${row.status} - ${row.profile_id ? `${row.firstName} ${row.lastName}` : 'NO PROFILE'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

fixUserProfilesSimple().catch(console.error);
