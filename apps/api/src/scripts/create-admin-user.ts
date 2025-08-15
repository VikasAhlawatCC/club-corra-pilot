import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { UserProfile, Gender } from '../users/entities/user-profile.entity';
import { PaymentDetails } from '../users/entities/payment-details.entity';
import { AuthProvider, ProviderType } from '../users/entities/auth-provider.entity';
import { CoinBalance } from '../coins/entities/coin-balance.entity';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const userProfileRepository = app.get<Repository<UserProfile>>(getRepositoryToken(UserProfile));
    const paymentDetailsRepository = app.get<Repository<PaymentDetails>>(getRepositoryToken(PaymentDetails));
    const authProviderRepository = app.get<Repository<AuthProvider>>(getRepositoryToken(AuthProvider));
    const coinBalanceRepository = app.get<Repository<CoinBalance>>(getRepositoryToken(CoinBalance));

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({ 
      where: { email: 'admin@clubcorra.com' } 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = userRepository.create({
      mobileNumber: '+919999999999',
      email: 'admin@clubcorra.com',
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: true,
      passwordHash: hashedPassword,
      roles: ['ADMIN', 'SUPER_ADMIN']
    });

    const savedAdminUser = await userRepository.save(adminUser);

    // Create admin profile
    const adminProfile = userProfileRepository.create({
      userId: savedAdminUser.id,
      firstName: 'System',
      lastName: 'Administrator',
      dateOfBirth: new Date('1990-01-01'),
      gender: Gender.MALE,
      profilePicture: 'https://example.com/admin-profile.jpg',
      street: 'Admin Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
    });
    await userProfileRepository.save(adminProfile);

    // Create admin payment details
    const adminPaymentDetails = paymentDetailsRepository.create({
      userId: savedAdminUser.id,
      upiId: 'admin@clubcorra',
      mobileNumber: '+919999999999',
    });
    await paymentDetailsRepository.save(adminPaymentDetails);

    // Create admin coin balance
    const adminCoinBalance = coinBalanceRepository.create({
      userId: savedAdminUser.id,
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
    });
    await coinBalanceRepository.save(adminCoinBalance);

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@clubcorra.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', savedAdminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

createAdminUser();
