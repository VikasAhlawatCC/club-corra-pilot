#!/usr/bin/env node

/**
 * Test Signup Flow for Mobile Number 8397070179
 * Tests the complete signup process step by step
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data for mobile number 8397070179
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  mobileNumber: '8397070179',
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
    return true;
  } else {
    logError('API health check failed');
    logError(`Status: ${response.status}`);
    return false;
  }
}

// Test 2: Initial Signup
async function testInitialSignup() {
  logStep(2, 'Initial Signup');
  
  const signupData = {
    firstName: TEST_USER.firstName,
    lastName: TEST_USER.lastName,
    mobileNumber: TEST_USER.mobileNumber
  };
  
  logInfo(`Sending signup data: ${JSON.stringify(signupData, null, 2)}`);
  
  const response = await makeRequest('/auth/signup/initial', {
    method: 'POST',
    body: JSON.stringify(signupData)
  });
  
  if (response.success) {
    logSuccess('Initial signup successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } else {
    logError('Initial signup failed');
    logError(`Status: ${response.status}`);
    logError(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return null;
  }
}

// Test 3: Check if user was created in database
async function checkUserInDatabase() {
  logStep(3, 'Check User in Database');
  
  // This would require database access, but for now we'll just log the expected result
  logInfo('User should be created with PENDING status');
  logInfo('Profile should be created with firstName and lastName');
  logInfo('Check the database manually to verify');
}

// Test 4: Simulate OTP Verification (this would require actual OTP)
async function testOtpVerification() {
  logStep(4, 'OTP Verification (Simulated)');
  
  logWarning('This step requires actual OTP from SMS');
  logInfo('In a real scenario, you would:');
  logInfo('1. Receive OTP via SMS');
  logInfo('2. Call /auth/signup/verify-otp with the OTP');
  logInfo('3. Verify the response');
  
  // For testing, we'll just show what the request should look like
  const otpData = {
    mobileNumber: TEST_USER.mobileNumber,
    otpCode: '123456' // This would be the actual OTP
  };
  
  logInfo(`OTP verification request would be: ${JSON.stringify(otpData, null, 2)}`);
}

// Test 5: Simulate Password Setup
async function testPasswordSetup() {
  logStep(5, 'Password Setup (Simulated)');
  
  logInfo('After OTP verification, you would:');
  logInfo('1. Call /auth/signup/setup-password with password data');
  logInfo('2. Verify the response includes user profile information');
  
  const passwordData = {
    mobileNumber: TEST_USER.mobileNumber,
    password: TEST_USER.password,
    confirmPassword: TEST_USER.confirmPassword
  };
  
  logInfo(`Password setup request would be: ${JSON.stringify(passwordData, null, 2)}`);
}

// Main test function
async function runTests() {
  log(`${colors.bright}${colors.magenta}🚀 Starting Signup Flow Test for Mobile Number: ${TEST_USER.mobileNumber}${colors.reset}`);
  
  try {
    // Test 1: API Health
    const apiHealthy = await testApiHealth();
    if (!apiHealthy) {
      logError('Cannot proceed with tests - API is not healthy');
      return;
    }
    
    // Test 2: Initial Signup
    const signupResult = await testInitialSignup();
    if (!signupResult) {
      logError('Cannot proceed - initial signup failed');
      return;
    }
    
    // Test 3: Check Database
    await checkUserInDatabase();
    
    // Test 4: OTP Verification
    await testOtpVerification();
    
    // Test 5: Password Setup
    await testPasswordSetup();
    
    log(`\n${colors.bright}${colors.green}🎉 Signup Flow Test Completed!${colors.reset}`);
    logInfo('Check the database to see if the user was created successfully');
    
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests().catch(console.error);
