#!/usr/bin/env node

/**
 * Test script to verify login flow functionality
 * Run with: yarn test:login
 */

const API_BASE_URL = 'http://192.168.1.4:3001/api/v1';

async function testServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      return {
        test: 'Server Health Check',
        success: true,
        message: 'Server is accessible',
        details: data
      };
    } else {
      return {
        test: 'Server Health Check',
        success: false,
        message: `Server responded with status ${response.status}`,
        details: data
      };
    }
  } catch (error) {
    return {
      test: 'Server Health Check',
      success: false,
      message: `Server health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

async function testLoginEndpoint() {
  try {
    // Test with invalid credentials first
    const response = await fetch(`${API_BASE_URL}/auth/login/mobile-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNumber: '+1234567890',
        password: 'wrongpassword'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      return {
        test: 'Login Endpoint - Invalid Credentials',
        success: true,
        message: 'Endpoint correctly rejects invalid credentials',
        details: { status: response.status, message: data.message }
      };
    } else {
      return {
        test: 'Login Endpoint - Invalid Credentials',
        success: false,
        message: `Expected 401 status, got ${response.status}`,
        details: { status: response.status, data }
      };
    }
  } catch (error) {
    return {
      test: 'Login Endpoint - Invalid Credentials',
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

async function testNonExistentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/mobile-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNumber: '+9999999999',
        password: 'anypassword'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      return {
        test: 'Login Endpoint - Non-existent User',
        success: true,
        message: 'Endpoint correctly rejects non-existent user',
        details: { status: response.status, message: data.message }
      };
    } else {
      return {
        test: 'Login Endpoint - Non-existent User',
        success: false,
        message: `Expected 401 status, got ${response.status}`,
        details: { status: response.status, data }
      };
    }
  } catch (error) {
    return {
      test: 'Login Endpoint - Non-existent User',
        success: false,
        message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
  }
}

async function runTests() {
  console.log('🧪 Testing Login Flow...\n');
  
  const tests = [
    testServerHealth,
    testLoginEndpoint,
    testNonExistentUser
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      console.log(`${result.success ? '✅' : '❌'} ${result.test}`);
      console.log(`   ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('');
      failed++;
    }
  }
  
  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Login flow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests
runTests().catch(console.error);
