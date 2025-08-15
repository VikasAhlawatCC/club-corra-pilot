#!/usr/bin/env node

/**
 * Simple Authentication Flow Test
 * Tests the core authentication endpoints step by step
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data
const TEST_USER = {
  firstName: 'Simple',
  lastName: 'TestUser',
  mobileNumber: '+919876543297', // Use a unique number for testing
  email: 'simple.test@example.com',
  password: 'TestPass123',
  confirmPassword: 'TestPass123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${colors.bright}${colors.blue}=== STEP ${step}: ${description} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Utility function to make HTTP requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Platform': 'test',
      'X-Client-Type': 'test-script'
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

// Test 1: API Health Check
async function testApiHealth() {
  logStep(1, 'API Health Check');
  
  const response = await makeRequest('/health');
  
  if (response.success) {
    logSuccess('API is healthy and responding');
    logInfo(`Status: ${response.data.status}`);
    logInfo(`Version: ${response.data.version}`);
    
    // Check database health specifically
    if (response.data.checks) {
      const dbCheck = response.data.checks.find(check => check.name === 'Database');
      if (dbCheck && dbCheck.status === 'ok') {
        logSuccess('Database connection is healthy');
      } else {
        logError('Database connection is unhealthy');
        return false;
      }
    }
    
    return true;
  } else {
    logError('API health check failed');
    return false;
  }
}

// Test 2: Test OTP Request
async function testOtpRequest() {
  logStep(2, 'Test OTP Request');
  
  const payload = {
    mobileNumber: TEST_USER.mobileNumber,
    type: 'SMS'
  };
  
  logInfo(`Requesting OTP for: ${TEST_USER.mobileNumber}`);
  
  const response = await makeRequest('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('OTP request successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else {
    logError('OTP request failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 3: Test Initial Signup
async function testInitialSignup() {
  logStep(3, 'Test Initial Signup');
  
  const payload = {
    firstName: TEST_USER.firstName,
    lastName: TEST_USER.lastName,
    mobileNumber: TEST_USER.mobileNumber
  };
  
  logInfo(`Testing signup with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/signup/initial', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('Initial signup successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else {
    logError('Initial signup failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 4: Test User Service Directly
async function testUserService() {
  logStep(4, 'Test User Service');
  
  // Try to get a user by mobile number
  const response = await makeRequest(`/users/mobile/${TEST_USER.mobileNumber}`);
  
  if (response.success) {
    logSuccess('User service is working');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else if (response.status === 404) {
    logWarning('User not found (expected for new signup)');
    return true; // This is actually good - user service is working
  } else {
    logError('User service test failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 5: Test OTP Service Directly
async function testOtpService() {
  logStep(5, 'Test OTP Service');
  
  // Try to get OTP status
  const response = await makeRequest(`/auth/otp-status/${TEST_USER.mobileNumber}`);
  
  if (response.success) {
    logSuccess('OTP service is working');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else if (response.status === 404) {
    logWarning('OTP not found (expected for new request)');
    return true; // This is actually good - OTP service is working
  } else {
    logError('OTP service test failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Main test runner
async function runSimpleTests() {
  log(`${colors.bright}${colors.magenta}🔍 SIMPLE AUTHENTICATION FLOW TEST 🔍${colors.reset}`);
  log(`${colors.bright}${colors.cyan}Testing Core Components Step by Step${colors.reset}\n`);
  
  const testResults = [];
  
  try {
    // Run tests in order
    testResults.push(await testApiHealth());
    testResults.push(await testUserService());
    testResults.push(await testOtpService());
    testResults.push(await testOtpRequest());
    testResults.push(await testInitialSignup());
    
    // Summary
    log(`\n${colors.bright}${colors.magenta}📊 TEST SUMMARY 📊${colors.reset}`);
    
    const passedTests = testResults.filter(r => r === true).length;
    const totalTests = testResults.length;
    
    log(`Total Tests: ${totalTests}`);
    log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
    
    if (passedTests === totalTests) {
      log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED! 🎉${colors.reset}`);
      log(`${colors.green}Core authentication components are working correctly!${colors.reset}`);
    } else {
      log(`\n${colors.bright}${colors.yellow}⚠️  SOME TESTS FAILED ⚠️${colors.reset}`);
      log(`${colors.yellow}Please review the failed tests above.${colors.reset}`);
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runSimpleTests().catch(console.error);
}

module.exports = {
  runSimpleTests,
  testApiHealth,
  testOtpRequest,
  testInitialSignup,
  testUserService,
  testOtpService
};
