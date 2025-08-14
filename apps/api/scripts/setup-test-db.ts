#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Setup test database for authentication flow testing
 * This script creates a test database and runs necessary migrations
 */

async function setupTestDatabase() {
  console.log('🔧 Setting up test database for authentication flow testing...');

  try {
    // Check if PostgreSQL is running
    console.log('📊 Checking PostgreSQL connection...');
    execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is running');

    // Create test database if it doesn't exist
    console.log('🗄️  Creating test database...');
    try {
      execSync(
        'createdb -h localhost -U club_corra_user -p 5432 clubcorra_test',
        { 
          stdio: 'pipe',
          env: { ...process.env, PGPASSWORD: 'club_corra_password' }
        }
      );
      console.log('✅ Test database created successfully');
    } catch (error) {
      console.log('ℹ️  Test database already exists or creation failed (this is OK)');
    }

    // Run database migrations for test environment
    console.log('🔄 Running test database migrations...');
    try {
      execSync('npm run migration:run:test', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ Test database migrations completed');
    } catch (error) {
      console.log('⚠️  Migration command not found, skipping migrations');
    }

    console.log('🎉 Test database setup completed successfully!');
    console.log('📝 You can now run authentication flow tests');

  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running: docker-compose up postgres');
    console.log('2. Check database credentials in docker-compose.yml');
    console.log('3. Ensure you have psql client tools installed');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestDatabase();
}

export { setupTestDatabase };
