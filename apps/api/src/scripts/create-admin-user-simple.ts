import { DataSource } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  // Create a simple data source for the script
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'club_corra_user',
    password: process.env.DB_PASSWORD || 'club_corra_password',
    database: process.env.DB_NAME || 'club_corra_db',
    entities: [User],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const userRepository = dataSource.getRepository(User);

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
    console.log('✅ Admin user created:', savedAdminUser.id);

    console.log('🎉 Admin user created successfully');
    console.log('📧 Email: admin@clubcorra.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', savedAdminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createAdminUser();
