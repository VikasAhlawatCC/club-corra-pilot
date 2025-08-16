import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserProfile } from '../src/users/entities/user-profile.entity';
import { PaymentDetails } from '../src/users/entities/payment-details.entity';
import { AuthProvider } from '../src/users/entities/auth-provider.entity';
import { CoinBalance } from '../src/coins/entities/coin-balance.entity';
import { CoinTransaction } from '../src/coins/entities/coin-transaction.entity';
import { File } from '../src/files/file.entity';
import { Notification } from '../src/notifications/notification.entity';
import { Brand } from '../src/brands/entities/brand.entity';
import { BrandCategory } from '../src/brands/entities/brand-category.entity';

async function fixUserProfiles() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_e91RZvdAtrYG@ep-old-firefly-a1o93p6l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    entities: [
      User, 
      UserProfile, 
      PaymentDetails, 
      AuthProvider, 
      CoinBalance, 
      CoinTransaction, 
      File, 
      Notification,
      Brand,
      BrandCategory
    ],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Find all users without profiles
    const usersWithoutProfiles = await dataSource.getRepository(User).find({
      where: { profile: null },
      relations: ['profile'],
    });

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    for (const user of usersWithoutProfiles) {
      console.log(`\nProcessing user: ${user.mobileNumber} (${user.id})`);
      
      try {
        // Create a profile for this user
        const profile = dataSource.getRepository(UserProfile).create({
          firstName: 'User', // Default first name
          lastName: user.mobileNumber.slice(-4), // Use last 4 digits of mobile as last name
          userId: user.id,
        });

        const savedProfile = await dataSource.getRepository(UserProfile).save(profile);
        console.log(`✅ Created profile for user ${user.mobileNumber}: ${savedProfile.firstName} ${savedProfile.lastName}`);
        
        // Update the user to link to the profile
        user.profile = savedProfile;
        await dataSource.getRepository(User).save(user);
        console.log(`✅ Updated user ${user.mobileNumber} to link to profile`);
        
      } catch (error) {
        console.error(`❌ Failed to create profile for user ${user.mobileNumber}:`, error.message);
      }
    }

    // Verify the fix
    const allUsers = await dataSource.getRepository(User).find({
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    console.log('\n=== VERIFICATION ===');
    allUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - ${u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'NO PROFILE'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\nDatabase connection closed');
    }
  }
}

fixUserProfiles().catch(console.error);
