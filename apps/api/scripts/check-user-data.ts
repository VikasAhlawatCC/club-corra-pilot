import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserProfile } from '../src/users/entities/user-profile.entity';
import { PaymentDetails } from '../src/users/entities/payment-details.entity';
import { AuthProvider } from '../src/users/entities/auth-provider.entity';
import { CoinBalance } from '../src/coins/entities/coin-balance.entity';
import { CoinTransaction } from '../src/coins/entities/coin-transaction.entity';
import { File } from '../src/files/file.entity';
import { Notification } from '../src/notifications/notification.entity';

async function checkUserData() {
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
      Notification
    ],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const mobileNumber = '8397070179';
    
    // Check if user exists
    const user = await dataSource.getRepository(User).findOne({
      where: { mobileNumber },
      relations: ['profile'],
    });

    if (user) {
      console.log('\n=== USER FOUND ===');
      console.log('User ID:', user.id);
      console.log('Mobile Number:', user.mobileNumber);
      console.log('Status:', user.status);
      console.log('Mobile Verified:', user.isMobileVerified);
      console.log('Email Verified:', user.isEmailVerified);
      console.log('Created At:', user.createdAt);
      console.log('Updated At:', user.updatedAt);
      
      if (user.profile) {
        console.log('\n=== PROFILE FOUND ===');
        console.log('Profile ID:', user.profile.id);
        console.log('First Name:', user.profile.firstName);
        console.log('Last Name:', user.profile.lastName);
        console.log('Profile Created At:', user.profile.createdAt);
        console.log('Profile Updated At:', user.profile.updatedAt);
      } else {
        console.log('\n=== NO PROFILE FOUND ===');
        console.log('User exists but has no profile!');
      }
    } else {
      console.log('\n=== NO USER FOUND ===');
      console.log(`No user found with mobile number: ${mobileNumber}`);
    }

    // Also check all users to see the current state
    const allUsers = await dataSource.getRepository(User).find({
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    console.log('\n=== RECENT USERS ===');
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

checkUserData().catch(console.error);
