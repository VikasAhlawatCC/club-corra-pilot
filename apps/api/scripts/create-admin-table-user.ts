import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminRole, AdminStatus } from '../src/admin/admin.entity';
import * as bcrypt from 'bcrypt';

async function createAdminTableUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const adminRepository = app.get<Repository<Admin>>(getRepositoryToken(Admin));

    // Check if admin user already exists
    const existingAdmin = await adminRepository.findOne({ 
      where: { email: 'admin@clubcorra.com' } 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists in admin table');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = adminRepository.create({
      email: 'admin@clubcorra.com',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: AdminRole.SUPER_ADMIN,
      status: AdminStatus.ACTIVE,
      phoneNumber: '+919999999999',
      department: 'System Administration',
      permissions: JSON.stringify(['transactions', 'brands', 'categories', 'users', 'coins', 'payments', 'admin_management'])
    });

    const savedAdminUser = await adminRepository.save(adminUser);

    console.log('✅ Admin user created successfully in admin table');
    console.log('📧 Email: admin@clubcorra.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Admin ID:', savedAdminUser.id);
    console.log('👑 Role:', savedAdminUser.role);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await app.close();
  }
}

createAdminTableUser();
