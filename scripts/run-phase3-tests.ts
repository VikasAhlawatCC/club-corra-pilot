#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting Phase 3: Authentication Integration & Testing');
console.log('========================================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  try {
    log(`\n${colors.cyan}▶ ${description}${colors.reset}`);
    log(`${colors.yellow}Running: ${command}${colors.reset}\n`);
    
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`, 'red');
    log(`${colors.red}Error: ${error}${colors.reset}`, 'red');
    return false;
  }
}

function checkPrerequisites(): boolean {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check if we're in the right directory
  if (!existsSync('package.json')) {
    log('❌ Not in project root directory', 'red');
    return false;
  }
  
  // Check if node_modules exists
  if (!existsSync('node_modules')) {
    log('❌ Dependencies not installed. Run "yarn install" first', 'red');
    return false;
  }
  
  // Check if .env.test exists
  if (!existsSync('.env.test')) {
    log('⚠️  .env.test file not found. Tests may fail without proper configuration', 'yellow');
  }
  
  log('✅ Prerequisites check completed', 'green');
  return true;
}

function runBackendTests(): boolean {
  log('\n🧪 Running Backend Integration Tests...', 'blue');
  
  const backendTestPath = 'apps/api/src/__tests__/integration';
  
  if (!existsSync(backendTestPath)) {
    log('❌ Backend test directory not found', 'red');
    return false;
  }
  
  // Run backend integration tests
  const authFlowTest = runCommand(
    'yarn workspace @club-corra/api test --testPathPattern="auth-flow-integration.spec.ts"',
    'Authentication Flow Integration Tests'
  );
  
  const backendMobileTest = runCommand(
    'yarn workspace @club-corra/api test --testPathPattern="backend-mobile-integration.spec.ts"',
    'Backend-Mobile Integration Tests'
  );
  
  return authFlowTest && backendMobileTest;
}

function runMobileTests(): boolean {
  log('\n📱 Running Mobile App Integration Tests...', 'blue');
  
  const mobileTestPath = 'apps/mobile/src/__tests__/integration';
  
  if (!existsSync(mobileTestPath)) {
    log('❌ Mobile test directory not found', 'red');
    return false;
  }
  
  // Run mobile integration tests
  const authIntegrationTest = runCommand(
    'yarn workspace @club-corra/mobile test --testPathPattern="auth-integration.test.tsx"',
    'Authentication Integration Tests'
  );
  
  const mobileE2ETest = runCommand(
    'yarn workspace @club-corra/mobile test --testPathPattern="mobile-e2e.test.tsx"',
    'Mobile End-to-End Tests'
  );
  
  return authIntegrationTest && mobileE2ETest;
}

function runSharedPackageTests(): boolean {
  log('\n📦 Running Shared Package Tests...', 'blue');
  
  const sharedTestPath = 'packages/shared/src/__tests__';
  
  if (!existsSync(sharedTestPath)) {
    log('❌ Shared package test directory not found', 'red');
    return false;
  }
  
  // Run shared package tests
  const sharedTests = runCommand(
    'yarn workspace @shared/shared test',
    'Shared Package Tests'
  );
  
  return sharedTests;
}

function runEndToEndTests(): boolean {
  log('\n🔄 Running End-to-End Integration Tests...', 'blue');
  
  // Run the existing end-to-end tests
  const e2eTests = runCommand(
    'yarn workspace @club-corra/api test --testPathPattern="end-to-end.spec.ts"',
    'Complete End-to-End Tests'
  );
  
  return e2eTests;
}

function runPerformanceTests(): boolean {
  log('\n⚡ Running Performance Tests...', 'blue');
  
  const performanceTestPath = 'apps/api/src/__tests__/performance';
  
  if (!existsSync(performanceTestPath)) {
    log('❌ Performance test directory not found', 'red');
    return false;
  }
  
  // Run performance tests
  const performanceTests = runCommand(
    'yarn workspace @club-corra/api test --testPathPattern="performance.spec.ts"',
    'Performance Tests'
  );
  
  return performanceTests;
}

function runSecurityTests(): boolean {
  log('\n🔒 Running Security Tests...', 'blue');
  
  const securityTestPath = 'apps/api/src/__tests__/security';
  
  if (!existsSync(securityTestPath)) {
    log('❌ Security test directory not found', 'red');
    return false;
  }
  
  // Run security tests
  const securityTests = runCommand(
    'yarn workspace @club-corra/api test --testPathPattern="security-audit.spec.ts"',
    'Security Tests'
  );
  
  return securityTests;
}

function generateTestReport(results: { [key: string]: boolean }): void {
  log('\n📊 Test Results Summary', 'blue');
  log('========================');
  
  let passedCount = 0;
  let totalCount = 0;
  
  Object.entries(results).forEach(([testName, passed]) => {
    totalCount++;
    if (passed) {
      passedCount++;
      log(`✅ ${testName}`, 'green');
    } else {
      log(`❌ ${testName}`, 'red');
    }
  });
  
  log('\n📈 Summary', 'blue');
  log(`Passed: ${passedCount}/${totalCount}`);
  log(`Success Rate: ${Math.round((passedCount / totalCount) * 100)}%`);
  
  if (passedCount === totalCount) {
    log('\n🎉 All Phase 3 tests passed! Authentication integration is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
  }
}

async function main() {
  try {
    log('🚀 Phase 3: Authentication Integration & Testing', 'bright');
    log('==================================================', 'bright');
    
    // Check prerequisites
    if (!checkPrerequisites()) {
      log('\n❌ Prerequisites check failed. Exiting.', 'red');
      process.exit(1);
    }
    
    const results: { [key: string]: boolean } = {};
    
    // Run all test suites
    results['Shared Package Tests'] = runSharedPackageTests();
    results['Backend Integration Tests'] = runBackendTests();
    results['Mobile App Integration Tests'] = runMobileTests();
    results['End-to-End Tests'] = runEndToEndTests();
    results['Performance Tests'] = runPerformanceTests();
    results['Security Tests'] = runSecurityTests();
    
    // Generate test report
    generateTestReport(results);
    
    // Exit with appropriate code
    const allPassed = Object.values(results).every(result => result);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Unexpected error occurred: ${error}`, 'red');
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

export { main as runPhase3Tests };
