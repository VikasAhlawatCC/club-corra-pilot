#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  type: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  errors: string[];
}

interface TestSummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  results: TestResult[];
  timestamp: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting comprehensive test suite...\n');

    const testTypes = [
      { name: 'Unit Tests', command: 'npm run test:unit', project: 'Unit Tests' },
      { name: 'Integration Tests', command: 'npm run test:integration', project: 'Integration Tests' },
      { name: 'Performance Tests', command: 'npm run test:performance', project: 'Performance Tests' },
      { name: 'Security Tests', command: 'npm run test:security', project: 'Security Tests' },
      { name: 'Real-time Tests', command: 'npm run test:realtime', project: 'Real-time Tests' },
    ];

    for (const testType of testTypes) {
      console.log(`📋 Running ${testType.name}...`);
      await this.runTestType(testType);
    }

    return this.generateSummary();
  }

  private async runTestType(testType: { name: string; command: string; project: string }): Promise<void> {
    const testStartTime = Date.now();
    let passed = 0;
    let failed = 0;
    let total = 0;
    const errors: string[] = [];

    try {
      // Run the test command
      const output = execSync(testType.command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });

      // Parse Jest output to extract test results
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('Tests:')) {
          const match = line.match(/(\d+) passed, (\d+) failed/);
          if (match) {
            passed = parseInt(match[1]);
            failed = parseInt(match[2]);
            total = passed + failed;
          }
        }
      }

      console.log(`✅ ${testType.name} completed: ${passed} passed, ${failed} failed`);

    } catch (error: any) {
      failed = 1;
      total = 1;
      errors.push(error.message || 'Test execution failed');
      console.log(`❌ ${testType.name} failed: ${error.message}`);
    }

    const duration = Date.now() - testStartTime;
    
    this.results.push({
      type: testType.name,
      passed,
      failed,
      total,
      duration,
      errors,
    });
  }

  private generateSummary(): TestSummary {
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = Date.now() - this.startTime;

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      results: this.results,
      timestamp: new Date().toISOString(),
    };
  }

  generateReport(summary: TestSummary): void {
    console.log('\n📊 Test Execution Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.totalPassed} ✅`);
    console.log(`Failed: ${summary.totalFailed} ❌`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Timestamp: ${summary.timestamp}`);
    
    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(50));
    
    for (const result of summary.results) {
      const status = result.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${result.type}: ${result.passed}/${result.total} passed (${result.duration}ms)`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }

    // Save detailed report to file
    this.saveReportToFile(summary);
  }

  private saveReportToFile(summary: TestSummary): void {
    const reportsDir = join(process.cwd(), 'test-reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const reportFile = join(reportsDir, `test-report-${Date.now()}.json`);
    writeFileSync(reportFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  }

  async runSpecificTest(testType: string): Promise<void> {
    const testTypes = {
      'unit': { name: 'Unit Tests', command: 'npm run test:unit' },
      'integration': { name: 'Integration Tests', command: 'npm run test:integration' },
      'performance': { name: 'Performance Tests', command: 'npm run test:performance' },
      'security': { name: 'Security Tests', command: 'npm run test:security' },
      'realtime': { name: 'Real-time Tests', command: 'npm run test:realtime' },
    };

    const testTypeConfig = testTypes[testType as keyof typeof testTypes];
    if (!testTypeConfig) {
      console.error(`❌ Unknown test type: ${testType}`);
      console.log('Available test types: unit, integration, performance, security, realtime');
      process.exit(1);
    }

    console.log(`🚀 Running ${testTypeConfig.name}...`);
    await this.runTestType(testTypeConfig);
    
    const summary = this.generateSummary();
    this.generateReport(summary);
  }

  async runWithCoverage(): Promise<void> {
    console.log('🚀 Running tests with coverage...');
    
    try {
      execSync('npm run test:ci', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Coverage tests completed successfully');
    } catch (error: any) {
      console.error('❌ Coverage tests failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    // Run all tests
    const summary = await runner.runAllTests();
    runner.generateReport(summary);
  } else {
    const command = args[0];
    
    switch (command) {
      case 'all':
        const summary = await runner.runAllTests();
        runner.generateReport(summary);
        break;
        
      case 'unit':
      case 'integration':
      case 'performance':
      case 'security':
      case 'realtime':
        await runner.runSpecificTest(command);
        break;
        
      case 'coverage':
        await runner.runWithCoverage();
        break;
        
      case 'help':
        console.log(`
Usage: npm run test:runner [command]

Commands:
  all        Run all test types (default)
  unit       Run only unit tests
  integration Run only integration tests
  performance Run only performance tests
  security   Run only security tests
  realtime   Run only real-time tests
  coverage   Run tests with coverage
  help       Show this help message

Examples:
  npm run test:runner
  npm run test:runner unit
  npm run test:runner performance
  npm run test:runner coverage
        `);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "npm run test:runner help" for usage information');
        process.exit(1);
    }
  }

  // Exit with appropriate code based on test results
  const hasFailures = runner.results.some(result => result.failed > 0);
  process.exit(hasFailures ? 1 : 0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };
