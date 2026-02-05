/**
 * Test Configuration
 * Centralized configuration for all test suites
 */

export const TEST_CONFIG = {
  // Base URLs for different environments
  baseUrls: {
    development: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    test: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    staging: process.env.NEXT_PUBLIC_APP_URL || 'https://staging.hairsalonx.nl',
    production: process.env.NEXT_PUBLIC_APP_URL || 'https://hairsalonx.nl',
  },

  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Test timeouts
  timeouts: {
    default: 30000,
    api: 10000,
    db: 15000,
    e2e: 60000,
  },

  // Test data
  testData: {
    salonId: '550e8400-e29b-41d4-a716-446655440000',
    testUser: {
      email: 'test@example.com',
      password: 'Test123!',
    },
    adminUser: {
      email: 'admin@hairsalonx.nl',
      password: 'admin123',
    },
  },
};

// Validation helper
export function validateConfig(): boolean {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  return true;
}

// Test result formatter
export interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  proof?: {
    statusCode?: number;
    responseBody?: unknown;
    rowCount?: number;
    message?: string;
  };
  error?: string;
}

export function formatResult(result: TestResult): string {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  const duration = `${result.duration}ms`;
  let output = `${icon} ${result.test} (${duration})`;
  
  if (result.proof) {
    const proofs: string[] = [];
    if (result.proof.statusCode !== undefined) proofs.push(`status: ${result.proof.statusCode}`);
    if (result.proof.rowCount !== undefined) proofs.push(`rows: ${result.proof.rowCount}`);
    if (result.proof.message) proofs.push(`msg: ${result.proof.message}`);
    if (proofs.length > 0) output += `\n   📋 Proof: ${proofs.join(', ')}`;
  }
  
  if (result.error) {
    output += `\n   ⚠️ Error: ${result.error}`;
  }
  
  return output;
}

export function printSummary(results: TestResult[]): void {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total:  ${total}`);
  console.log(`✅ Pass:   ${passed}`);
  console.log(`❌ Fail:   ${failed}`);
  console.log(`⏭️ Skip:   ${skipped}`);
  console.log('='.repeat(50));
  
  process.exit(failed > 0 ? 1 : 0);
}
