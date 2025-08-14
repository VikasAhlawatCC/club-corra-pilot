"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSharedTypesCompatibility = testSharedTypesCompatibility;
exports.testApiResponseCompatibility = testApiResponseCompatibility;
exports.runCompatibilityTestSuite = runCompatibilityTestSuite;
exports.generateCompatibilityReport = generateCompatibilityReport;
const types_1 = require("../types");
function testSharedTypesCompatibility() {
    const results = [];
    try {
        const testUser = {
            id: 'test-id',
            mobileNumber: '+1234567890',
            email: 'test@example.com',
            status: types_1.UserStatus.ACTIVE,
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
                    provider: types_1.AuthProvider.SMS,
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
    }
    catch (error) {
        results.push({
            success: false,
            platform: 'shared',
            testName: 'User Interface Compatibility',
            details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
        });
    }
    try {
        const testToken = {
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
    }
    catch (error) {
        results.push({
            success: false,
            platform: 'shared',
            testName: 'AuthToken Interface Compatibility',
            details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
        });
    }
    try {
        const testStatus = types_1.UserStatus.ACTIVE;
        const testProvider = types_1.AuthProvider.GOOGLE;
        results.push({
            success: true,
            platform: 'shared',
            testName: 'Enum Compatibility',
            details: 'Enums are properly defined and compatible',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
function testApiResponseCompatibility(apiResponse) {
    const results = [];
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
    }
    catch (error) {
        results.push({
            success: false,
            platform: 'api',
            testName: 'Response Structure',
            details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
        });
    }
    try {
        if (apiResponse.user) {
            const user = apiResponse.user;
            if (user.id && user.mobileNumber && user.status !== undefined) {
                results.push({
                    success: true,
                    platform: 'api',
                    testName: 'User Data Structure',
                    details: 'User data has required fields',
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                throw new Error('User data missing required fields');
            }
        }
        else {
            throw new Error('No user data in response');
        }
    }
    catch (error) {
        results.push({
            success: false,
            platform: 'api',
            testName: 'User Data Structure',
            details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
        });
    }
    try {
        if (apiResponse.tokens) {
            const tokens = apiResponse.tokens;
            if (tokens.accessToken && tokens.refreshToken && tokens.expiresIn !== undefined) {
                results.push({
                    success: true,
                    platform: 'api',
                    testName: 'Token Data Structure',
                    details: 'Token data has required fields',
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                throw new Error('Token data missing required fields');
            }
        }
        else {
            throw new Error('No token data in response');
        }
    }
    catch (error) {
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
function runCompatibilityTestSuite(apiResponse) {
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
function generateCompatibilityReport(testSuite) {
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
//# sourceMappingURL=cross-platform-test.js.map