#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIntegrationTest = main;
const cross_platform_test_1 = require("./utils/cross-platform-test");
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
        console.log('📋 Testing Shared Types Compatibility...');
        const sharedTypeTests = (0, cross_platform_test_1.testSharedTypesCompatibility)();
        sharedTypeTests.forEach((test, index) => {
            const status = test.success ? '✅' : '❌';
            console.log(`  ${index + 1}. ${status} ${test.testName} (${test.platform})`);
            if (!test.success) {
                console.log(`     Details: ${test.details}`);
            }
        });
        console.log('\n🌐 Testing API Response Compatibility...');
        const testSuite = (0, cross_platform_test_1.runCompatibilityTestSuite)(mockApiResponse);
        const report = (0, cross_platform_test_1.generateCompatibilityReport)(testSuite);
        console.log('\n' + report);
        if (testSuite.summary.failed > 0) {
            console.log('\n❌ Some tests failed. Please check the details above.');
            process.exit(1);
        }
        else {
            console.log('\n🎉 All tests passed! Cross-platform integration is working correctly.');
            process.exit(0);
        }
    }
    catch (error) {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=test-integration.js.map