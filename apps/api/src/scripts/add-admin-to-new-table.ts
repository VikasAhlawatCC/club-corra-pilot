import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function addAdminToNewTable() {
  // Create a direct database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'club_corra_user',
    password: 'club_corra_password',
    database: 'club_corra_db',
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    const adminEmail = 'admin@clubcorra.com';
    const adminPassword = 'admin123';

    // Check if admins table exists
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('❌ Admins table does not exist. Please run the migration first.');
      return;
    }

    // Check if admin user already exists
    const existingAdmin = await dataSource.query(
      'SELECT * FROM admins WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('🆔 Admin ID:', existingAdmin[0].id);
      console.log('🔐 Role:', existingAdmin[0].role);
      console.log('📊 Status:', existingAdmin[0].status);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await dataSource.query(
      `INSERT INTO admins (
        email, "passwordHash", "firstName", "lastName", role, status,
        "profilePicture", "phoneNumber", department, permissions,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *`,
      [
        adminEmail, 
        hashedPassword, 
        'Vikas', 
        'Ahlawat', 
        'SUPER_ADMIN', 
        'ACTIVE',
        'https://example.com/vikas-profile.jpg',
        '+919999999998',
        'System Administration',
        JSON.stringify(['transactions', 'brands', 'categories', 'users', 'coins', 'payments', 'admin_management'])
      ]
    );

    const savedAdmin = adminUser[0];

    console.log('✅ Admin user created successfully in new admins table');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 Admin ID:', savedAdmin.id);
    console.log('🔐 Role:', savedAdmin.role);
    console.log('📊 Status:', savedAdmin.status);
    console.log('📱 Phone:', savedAdmin.phoneNumber);
    console.log('🏢 Department:', savedAdmin.department);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await dataSource.destroy();
  }
}

addAdminToNewTable();
