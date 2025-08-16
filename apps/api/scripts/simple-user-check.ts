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
      Notification,
      Brand,
      BrandCategory
    ],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Check all users to see the current state
    const allUsers = await dataSource.getRepository(User).find({
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    console.log('\n=== RECENT USERS ===');
    allUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.mobileNumber} - ${u.status} - ${u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'NO PROFILE'}`);
    });

    // Check specific user
    const mobileNumber = '8397070179';
    const user = await dataSource.getRepository(User).findOne({
      where: { mobileNumber },
      relations: ['profile'],
    });

    if (user) {
      console.log('\n=== SPECIFIC USER ===');
      console.log('User ID:', user.id);
      console.log('Mobile Number:', user.mobileNumber);
      console.log('Status:', user.status);
      console.log('Profile:', user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'NO PROFILE');
      if (user.profile) {
        console.log('First Name:', user.profile.firstName);
        console.log('Last Name:', user.profile.lastName);
      }
    }

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
