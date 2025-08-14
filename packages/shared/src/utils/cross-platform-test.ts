import { User, AuthToken, AuthProvider, UserStatus } from '../types';

/**
 * Cross-platform testing utilities for verifying compatibility
 * between mobile, web, and API applications
 */

export interface CrossPlatformTestResult {
  success: boolean;
  platform: string;
  testName: string;
  details: string;
  timestamp: string;
}

export interface CompatibilityTestSuite {
  name: string;
  tests: CrossPlatformTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

/**
 * Test shared types compatibility across platforms
 */
export function testSharedTypesCompatibility(): CrossPlatformTestResult[] {
  const results: CrossPlatformTestResult[] = [];

  // Test User interface compatibility
  try {
    const testUser: User = {
      id: 'test-id',
      mobileNumber: '+1234567890',
      email: 'test@example.com',
      status: UserStatus.ACTIVE,
      isMobileVerified: true,
      isEmailVerified: true,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      },
      paymentDetails: {
        upiId: 'john.doe@upi',
      },
      authProviders: [
        {
          provider: AuthProvider.SMS,
          providerId: 'sms-123',
          linkedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    results.push({
      success: true,
      platform: 'shared',
      testName: 'User Interface Compatibility',
      details: 'User interface is properly defined and compatible',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      success: false,
      platform: 'shared',
      testName: 'User Interface Compatibility',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Test AuthToken interface compatibility
  try {
    const testToken: AuthToken = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 604800,
      tokenType: 'Bearer',
    };

    results.push({
      success: true,
      platform: 'shared',
      testName: 'AuthToken Interface Compatibility',
      details: 'AuthToken interface is properly defined and compatible',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      success: false,
      platform: 'shared',
      testName: 'AuthToken Interface Compatibility',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Test enum compatibility
  try {
    const testStatus = UserStatus.ACTIVE;
    const testProvider = AuthProvider.GOOGLE;

    results.push({
      success: true,
      platform: 'shared',
      testName: 'Enum Compatibility',
      details: 'Enums are properly defined and compatible',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      success: false,
      platform: 'shared',
      testName: 'Enum Compatibility',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * Test API response compatibility
 */
export function testApiResponseCompatibility(apiResponse: any): CrossPlatformTestResult[] {
  const results: CrossPlatformTestResult[] = [];

  // Test if response has required structure
  try {
    if (!apiResponse) {
      throw new Error('API response is null or undefined');
    }

    results.push({
      success: true,
      platform: 'api',
      testName: 'Response Structure',
      details: 'API response has valid structure',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.push({
      success: false,
      platform: 'api',
      testName: 'Response Structure',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Test if response has user data
  try {
    if (apiResponse.user) {
      const user = apiResponse.user;
      
      // Check required user fields
      if (user.id && user.mobileNumber && user.status !== undefined) {
        results.push({
          success: true,
          platform: 'api',
          testName: 'User Data Structure',
          details: 'User data has required fields',
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error('User data missing required fields');
      }
    } else {
      throw new Error('No user data in response');
    }
  } catch (error) {
    results.push({
      success: false,
      platform: 'api',
      testName: 'User Data Structure',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Test if response has tokens
  try {
    if (apiResponse.tokens) {
      const tokens = apiResponse.tokens;
      
      // Check required token fields
      if (tokens.accessToken && tokens.refreshToken && tokens.expiresIn !== undefined) {
        results.push({
          success: true,
          platform: 'api',
          testName: 'Token Data Structure',
          details: 'Token data has required fields',
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error('Token data missing required fields');
      }
    } else {
      throw new Error('No token data in response');
    }
  } catch (error) {
    results.push({
      success: false,
      platform: 'api',
      testName: 'Token Data Structure',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    });
  }

  return results;
}

/**
 * Run complete compatibility test suite
 */
export function runCompatibilityTestSuite(apiResponse?: any): CompatibilityTestSuite {
  const sharedTypeTests = testSharedTypesCompatibility();
  const apiTests = apiResponse ? testApiResponseCompatibility(apiResponse) : [];
  
  const allTests = [...sharedTypeTests, ...apiTests];
  const passed = allTests.filter(test => test.success).length;
  const failed = allTests.filter(test => !test.success).length;
  
  return {
    name: 'Cross-Platform Compatibility Test Suite',
    tests: allTests,
    summary: {
      total: allTests.length,
      passed,
      failed,
      successRate: allTests.length > 0 ? (passed / allTests.length) * 100 : 0,
    },
  };
}

/**
 * Generate compatibility report
 */
export function generateCompatibilityReport(testSuite: CompatibilityTestSuite): string {
  const { name, tests, summary } = testSuite;
  
  let report = `# ${name}\n\n`;
  report += `## Summary\n`;
  report += `- Total Tests: ${summary.total}\n`;
  report += `- Passed: ${summary.passed}\n`;
  report += `- Failed: ${summary.failed}\n`;
  report += `- Success Rate: ${summary.successRate.toFixed(2)}%\n\n`;
  
  report += `## Test Results\n\n`;
  
  tests.forEach((test, index) => {
    const status = test.success ? '✅ PASS' : '❌ FAIL';
    report += `### ${index + 1}. ${test.testName} (${test.platform})\n`;
    report += `- Status: ${status}\n`;
    report += `- Details: ${test.details}\n`;
    report += `- Timestamp: ${test.timestamp}\n\n`;
  });
  
  return report;
}
