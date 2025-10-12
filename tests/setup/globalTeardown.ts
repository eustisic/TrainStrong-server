import { testPool } from './testDatabase.js';

export default async function globalTeardown() {
  try {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Close database connections
    await testPool.end();
    
    console.log('✓ Test environment cleaned up\n');
  } catch (error) {
    console.error('\n❌ Failed to cleanup test environment:', error);
    throw error;
  }
}