const { Client } = require('pg');

async function checkUserData() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_e91RZvdAtrYG@ep-old-firefly-a1o93p6l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });

  try {
    await client.connect();
    console.log('Database connection established');

    const mobileNumber = '8397070179';
    
    // Check if user exists with exact mobile number
    const userResult = await client.query(
      'SELECT * FROM users WHERE "mobileNumber" = $1',
      [mobileNumber]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('\n=== USER FOUND ===');
      console.log('User ID:', user.id);
      console.log('Mobile Number:', user.mobileNumber);
      console.log('Status:', user.status);
      console.log('Mobile Verified:', user.isMobileVerified);
      console.log('Email Verified:', user.isEmailVerified);
      console.log('Created At:', user.createdAt);
      console.log('Updated At:', user.updatedAt);
      
      // Check if profile exists
      const profileResult = await client.query(
        'SELECT * FROM user_profiles WHERE "userId" = $1',
        [user.id]
      );

      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        console.log('\n=== PROFILE FOUND ===');
        console.log('Profile ID:', profile.id);
        console.log('First Name:', profile.firstName);
        console.log('Last Name:', profile.lastName);
        console.log('Profile Created At:', profile.createdAt);
        console.log('Profile Updated At:', profile.updatedAt);
      } else {
        console.log('\n=== NO PROFILE FOUND ===');
        console.log('User exists but has no profile!');
      }
    } else {
      console.log('\n=== NO USER FOUND ===');
      console.log(`No user found with mobile number: ${mobileNumber}`);
      
      // Check for mobile number with +91 prefix
      console.log('\n=== CHECKING FOR +91 PREFIX ===');
      const userWithPrefixResult = await client.query(
        'SELECT * FROM users WHERE "mobileNumber" = $1',
        [`+91${mobileNumber}`]
      );
      
      if (userWithPrefixResult.rows.length > 0) {
        const user = userWithPrefixResult.rows[0];
        console.log('✅ USER FOUND WITH +91 PREFIX!');
        console.log('User ID:', user.id);
        console.log('Mobile Number:', user.mobileNumber);
        console.log('Status:', user.status);
        console.log('Mobile Verified:', user.isMobileVerified);
        console.log('Email Verified:', user.isEmailVerified);
        console.log('Created At:', user.createdAt);
        console.log('Updated At:', user.updatedAt);
        
        // Check if profile exists
        const profileResult = await client.query(
          'SELECT * FROM user_profiles WHERE "userId" = $1',
          [user.id]
        );

        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          console.log('\n=== PROFILE FOUND ===');
          console.log('Profile ID:', profile.id);
          console.log('First Name:', profile.firstName);
          console.log('Last Name:', profile.lastName);
          console.log('Profile Created At:', profile.createdAt);
          console.log('Profile Updated At:', profile.updatedAt);
        } else {
          console.log('\n=== NO PROFILE FOUND ===');
          console.log('User exists but has no profile!');
        }
      } else {
        console.log('No user found with +91 prefix either');
      }
      
      // Check for partial matches
      console.log('\n=== CHECKING FOR PARTIAL MATCHES ===');
      const partialResult = await client.query(
        'SELECT * FROM users WHERE "mobileNumber" LIKE $1',
        [`%${mobileNumber}%`]
      );
      
      if (partialResult.rows.length > 0) {
        console.log('Found users with partial mobile number match:');
        partialResult.rows.forEach((u, index) => {
          console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - Created: ${u.createdAt}`);
        });
      } else {
        console.log('No partial matches found');
      }
      
      // Check for users with similar mobile numbers
      console.log('\n=== CHECKING FOR SIMILAR MOBILE NUMBERS ===');
      const similarResult = await client.query(
        'SELECT * FROM users WHERE "mobileNumber" LIKE $1 OR "mobileNumber" LIKE $2',
        [`+91${mobileNumber}`, `91${mobileNumber}`]
      );
      
      if (similarResult.rows.length > 0) {
        console.log('Found users with similar mobile number format:');
        similarResult.rows.forEach((u, index) => {
          console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - Created: ${u.createdAt}`);
        });
      } else {
        console.log('No similar mobile number formats found');
      }
    }

    // Also check all users to see the current state
    const allUsersResult = await client.query(
      'SELECT u.id, u."mobileNumber", u.status, u."createdAt", p."firstName", p."lastName" FROM users u LEFT JOIN user_profiles p ON u.id = p."userId" ORDER BY u."createdAt" DESC LIMIT 10'
    );

    console.log('\n=== RECENT USERS ===');
    allUsersResult.rows.forEach((u, index) => {
      const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : 'NO PROFILE';
      console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - ${name}`);
    });

    // Check total user count
    const totalUsersResult = await client.query('SELECT COUNT(*) as total FROM users');
    console.log(`\n=== TOTAL USERS IN DATABASE: ${totalUsersResult.rows[0].total} ===`);

    // Check for users with PENDING status
    console.log('\n=== USERS WITH PENDING STATUS ===');
    const pendingUsersResult = await client.query(
      'SELECT u.id, u."mobileNumber", u.status, u."createdAt", u."isMobileVerified", u."isEmailVerified", p."firstName", p."lastName" FROM users u LEFT JOIN user_profiles p ON u.id = p."userId" WHERE u.status = $1 ORDER BY u."createdAt" DESC',
      ['PENDING']
    );
    
    if (pendingUsersResult.rows.length > 0) {
      console.log('Found users with PENDING status:');
      pendingUsersResult.rows.forEach((u, index) => {
        const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : 'NO PROFILE';
        console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - Mobile Verified: ${u.isMobileVerified} - Email Verified: ${u.isEmailVerified} - ${name}`);
      });
    } else {
      console.log('No users with PENDING status found');
    }

    // Check for users without profiles
    console.log('\n=== USERS WITHOUT PROFILES ===');
    const noProfileUsersResult = await client.query(
      'SELECT u.id, u."mobileNumber", u.status, u."createdAt" FROM users u LEFT JOIN user_profiles p ON u.id = p."userId" WHERE p.id IS NULL ORDER BY u."createdAt" DESC'
    );
    
    if (noProfileUsersResult.rows.length > 0) {
      console.log('Found users without profiles:');
      noProfileUsersResult.rows.forEach((u, index) => {
        console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - Created: ${u.createdAt}`);
      });
    } else {
      console.log('No users without profiles found');
    }

    // Check database tables
    console.log('\n=== DATABASE TABLES ===');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles')
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    tablesResult.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    // Check if users table has any data at all
    if (allUsersResult.rows.length === 0) {
      console.log('\n=== WARNING: USERS TABLE IS EMPTY ===');
      console.log('This suggests a serious database issue or the table is not being used');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkUserData().catch(console.error);
