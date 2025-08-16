import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Define the Admin entity structure locally to avoid import issues
interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phoneNumber?: string;
  department?: string;
  permissions?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function createAdminTableUser() {
  // Create a simple data source for the script
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'club_corra_user',
    password: process.env.DB_PASSWORD || 'club_corra_password',
    database: process.env.DB_NAME || 'club_corra_db',
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check if admin user already exists
    const existingAdmin = await dataSource.query(
      'SELECT * FROM admins WHERE email = $1',
      ['admin@clubcorra.com']
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists in admin table');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await dataSource.query(
      `INSERT INTO admins (id, email, "passwordHash", "firstName", "lastName", role, status, "phoneNumber", department, permissions, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, email, role`,
      [
        'admin@clubcorra.com',
        hashedPassword,
        'System',
        'Administrator',
        'SUPER_ADMIN',
        'ACTIVE',
        '+919999999999',
        'System Administration',
        JSON.stringify(['transactions', 'brands', 'categories', 'users', 'coins', 'payments', 'admin_management'])
      ]
    );

    const savedAdminUser = result[0];

    console.log('✅ Admin user created successfully in admin table');
    console.log('📧 Email: admin@clubcorra.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 Admin ID:', savedAdminUser.id);
    console.log('👑 Role:', savedAdminUser.role);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createAdminTableUser();
