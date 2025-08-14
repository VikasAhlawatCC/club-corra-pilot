#!/usr/bin/env node

/**
 * Cross-Platform Integration Test Script
 * 
 * This script can be run to verify that the shared types, schemas, and utilities
 * work correctly across all platforms (mobile, web, API).
 * 
 * Usage:
 * - From packages/shared: npm run test:integration
 * - From root: yarn workspace @shared test:integration
 */

import { 
  runCompatibilityTestSuite, 
  generateCompatibilityReport,
  testSharedTypesCompatibility 
} from './utils/cross-platform-test';

// Mock API response for testing
const mockApiResponse = {
  user: {
    id: 'test-user-id',
    mobileNumber: '+1234567890',
    email: 'test@example.com',
    status: 'ACTIVE',
    isMobileVerified: true,
    isEmailVerified: true,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      gender: 'MALE',
    },
    paymentDetails: {
      upiId: 'john.doe@upi',
    },
    authProviders: [
      {
        provider: 'SMS',
        providerUserId: 'sms-123',
        email: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 604800,
    tokenType: 'Bearer',
  },
};

function main() {
  console.log('🚀 Starting Cross-Platform Integration Test...\n');

  try {
    // Test shared types compatibility
    console.log('📋 Testing Shared Types Compatibility...');
    const sharedTypeTests = testSharedTypesCompatibility();
    
    sharedTypeTests.forEach((test, index) => {
      const status = test.success ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${test.testName} (${test.platform})`);
      if (!test.success) {
        console.log(`     Details: ${test.details}`);
      }
    });

    console.log('\n🌐 Testing API Response Compatibility...');
    
    // Run complete compatibility test suite
    const testSuite = runCompatibilityTestSuite(mockApiResponse);
    
    // Generate and display report
    const report = generateCompatibilityReport(testSuite);
    console.log('\n' + report);

    // Exit with appropriate code
    if (testSuite.summary.failed > 0) {
      console.log('\n❌ Some tests failed. Please check the details above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! Cross-platform integration is working correctly.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main();
}

export { main as runIntegrationTest };
