#!/usr/bin/env node

/**
 * Phase 3: Integration & Testing
 * Comprehensive authentication flow testing script
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test data
const TEST_USER = {
  firstName: 'Phase3',
  lastName: 'TestUser',
  mobileNumber: '+919876543299', // Use a unique number for testing
  email: 'phase3.test@example.com',
  password: 'TestPass123',
  confirmPassword: 'TestPass123',
  otpCode: '123456'
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
    logInfo(`Uptime: ${response.data.uptime}ms`);
    
    // Check individual health checks
    if (response.data.checks) {
      response.data.checks.forEach(check => {
        const status = check.status === 'ok' ? '✅' : '❌';
        log(`${status} ${check.name}: ${check.status} (${check.responseTime}ms)`);
      });
    }
  } else {
    logError('API health check failed');
    logError(`Status: ${response.status}`);
    if (response.data) {
      logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    }
  }
  
  return response.success;
}

// Test 2: Initial Signup
async function testInitialSignup() {
  logStep(2, 'Initial Signup Test');
  
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
    
    // Check if OTP verification is required
    if (response.data.requiresOtpVerification) {
      logInfo('OTP verification required - proceeding to next step');
      return true;
    } else if (response.data.redirectToLogin) {
      logWarning('User already exists, redirecting to login');
      return 'EXISTING_USER';
    } else {
      logWarning('Unexpected response format');
      return false;
    }
  } else {
    logError('Initial signup failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 3: OTP Verification
async function testOtpVerification() {
  logStep(3, 'OTP Verification Test');
  
  const payload = {
    mobileNumber: TEST_USER.mobileNumber,
    otpCode: TEST_USER.otpCode
  };
  
  logInfo(`Testing OTP verification with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/signup/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('OTP verification successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Check if password setup is required
    if (response.data.requiresPasswordSetup) {
      logInfo('Password setup required - proceeding to next step');
      return true;
    } else {
      logWarning('Unexpected response format');
      return false;
    }
  } else {
    logError('OTP verification failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 4: Password Setup
async function testPasswordSetup() {
  logStep(4, 'Password Setup Test');
  
  const payload = {
    mobileNumber: TEST_USER.mobileNumber,
    password: TEST_USER.password,
    confirmPassword: TEST_USER.confirmPassword
  };
  
  logInfo(`Testing password setup with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/signup/setup-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('Password setup successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Check if email verification is required
    if (response.data.requiresEmailVerification) {
      logInfo('Email verification required - proceeding to next step');
      return true;
    } else {
      logInfo('No email verification required - account setup complete');
      return 'COMPLETE';
    }
  } else {
    logError('Password setup failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 5: Email Addition
async function testEmailAddition() {
  logStep(5, 'Email Addition Test');
  
  const payload = {
    mobileNumber: TEST_USER.mobileNumber,
    email: TEST_USER.email
  };
  
  logInfo(`Testing email addition with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/signup/add-email', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('Email addition successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else {
    logError('Email addition failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 6: Login with Mobile + OTP
async function testMobileLogin() {
  logStep(6, 'Mobile Login Test');
  
  const payload = {
    mobileNumber: TEST_USER.mobileNumber,
    otpCode: TEST_USER.otpCode
  };
  
  logInfo(`Testing mobile login with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/login/mobile', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('Mobile login successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Check if tokens are returned
    if (response.data.tokens) {
      logSuccess('Authentication tokens received');
      logInfo(`Access token: ${response.data.tokens.accessToken ? '✅' : '❌'}`);
      logInfo(`Refresh token: ${response.data.tokens.refreshToken ? '✅' : '❌'}`);
    }
    
    return true;
  } else {
    logError('Mobile login failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 7: OAuth Signup
async function testOauthSignup() {
  logStep(7, 'OAuth Signup Test');
  
  const payload = {
    oauthProvider: 'GOOGLE',
    oauthToken: 'test-oauth-token-' + Date.now(),
    mobileNumber: '+919876543298', // Use a different number for OAuth test
    firstName: 'OAuth',
    lastName: 'TestUser'
  };
  
  logInfo(`Testing OAuth signup with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/oauth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('OAuth signup successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else {
    logError('OAuth signup failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 8: OAuth Login
async function testOauthLogin() {
  logStep(8, 'OAuth Login Test');
  
  const payload = {
    provider: 'GOOGLE',
    accessToken: 'test-oauth-token-' + Date.now()
  };
  
  logInfo(`Testing OAuth login with: ${JSON.stringify(payload, null, 2)}`);
  
  const response = await makeRequest('/auth/login/oauth', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('OAuth login successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } else {
    logError('OAuth login failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 9: Error Handling
async function testErrorHandling() {
  logStep(9, 'Error Handling Test');
  
  // Test 1: Invalid mobile number
  logInfo('Testing invalid mobile number...');
  const invalidMobileResponse = await makeRequest('/auth/signup/initial', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      mobileNumber: 'invalid'
    })
  });
  
  if (!invalidMobileResponse.success) {
    logSuccess('Invalid mobile number properly rejected');
  } else {
    logError('Invalid mobile number should have been rejected');
  }
  
  // Test 2: Missing required fields
  logInfo('Testing missing required fields...');
  const missingFieldsResponse = await makeRequest('/auth/signup/initial', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Test'
      // Missing lastName and mobileNumber
    })
  });
  
  if (!missingFieldsResponse.success) {
    logSuccess('Missing required fields properly rejected');
  } else {
    logError('Missing required fields should have been rejected');
  }
  
  // Test 3: Invalid OTP
  logInfo('Testing invalid OTP...');
  const invalidOtpResponse = await makeRequest('/auth/signup/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      mobileNumber: TEST_USER.mobileNumber,
      otpCode: '000000'
    })
  });
  
  if (!invalidOtpResponse.success) {
    logSuccess('Invalid OTP properly rejected');
  } else {
    logError('Invalid OTP should have been rejected');
  }
  
  return true;
}

// Test 10: OTP Service Test
async function testOtpService() {
  logStep(10, 'OTP Service Test');
  
  logInfo('Testing OTP request endpoint...');
  
  const payload = {
    mobileNumber: '+919876543299',
    type: 'SMS'
  };
  
  const response = await makeRequest('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (response.success) {
    logSuccess('OTP request successful');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Note: In a real scenario, we would get the OTP from the response
    // For testing purposes, we'll assume the OTP is sent via SMS/email
    logInfo('OTP sent successfully - proceed with verification using the received OTP');
    return true;
  } else {
    logError('OTP request failed');
    logError(`Status: ${response.status}`);
    logError(`Error: ${JSON.stringify(response.data, null, 2)}`);
    return false;
  }
}

// Test 11: Performance Test
async function testPerformance() {
  logStep(11, 'Performance Test');
  
  const iterations = 10;
  const startTime = Date.now();
  
  logInfo(`Running ${iterations} health check requests...`);
  
  const promises = [];
  for (let i = 0; i < iterations; i++) {
    promises.push(makeRequest('/health'));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  const successfulRequests = results.filter(r => r.success).length;
  
  logInfo(`Total time: ${totalTime}ms`);
  logInfo(`Average time per request: ${avgTime.toFixed(2)}ms`);
  logInfo(`Successful requests: ${successfulRequests}/${iterations}`);
  
  if (avgTime < 100) {
    logSuccess('Performance is good (< 100ms average)');
  } else if (avgTime < 500) {
    logWarning('Performance is acceptable (< 500ms average)');
  } else {
    logError('Performance is poor (> 500ms average)');
  }
  
  return successfulRequests === iterations;
}

// Main test runner
async function runAllTests() {
  log(`${colors.bright}${colors.magenta}🚀 PHASE 3: INTEGRATION & TESTING 🚀${colors.reset}`);
  log(`${colors.bright}${colors.cyan}Comprehensive Authentication Flow Testing${colors.reset}\n`);
  
  const testResults = [];
  
  try {
    // Run all tests
    testResults.push(await testApiHealth());
    testResults.push(await testInitialSignup());
    testResults.push(await testOtpVerification());
    testResults.push(await testPasswordSetup());
    testResults.push(await testEmailAddition());
    testResults.push(await testMobileLogin());
    testResults.push(await testOauthSignup());
    testResults.push(await testOauthLogin());
    testResults.push(await testErrorHandling());
    testResults.push(await testOtpService());
    testResults.push(await testPerformance());
    
    // Summary
    log(`\n${colors.bright}${colors.magenta}📊 TEST SUMMARY 📊${colors.reset}`);
    
    const passedTests = testResults.filter(r => r === true || r === 'COMPLETE' || r === 'EXISTING_USER').length;
    const totalTests = testResults.length;
    
    log(`Total Tests: ${totalTests}`);
    log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
    
    if (passedTests === totalTests) {
      log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED! 🎉${colors.reset}`);
      log(`${colors.green}Phase 3: Integration & Testing completed successfully!${colors.reset}`);
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
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testApiHealth,
  testInitialSignup,
  testOtpVerification,
  testPasswordSetup,
  testEmailAddition,
  testMobileLogin,
  testOauthSignup,
  testOauthLogin,
  testErrorHandling,
  testOtpService,
  testPerformance
};
