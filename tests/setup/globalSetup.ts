import { testPool } from './testDatabase.js';
import fs from 'fs/promises';
import path from 'path';

// Use a fixed path for Jest environment
const __dirname = path.resolve('./tests/setup');

async function runMigrations() {
  console.log('Running test database migrations...');
  
  const migrationsDir = path.join(__dirname, '../../src/migrations');
  const migrationFiles = await fs.readdir(migrationsDir);
  const sqlFiles = migrationFiles
    .filter(file => file.endsWith('.sql') && !file.endsWith('.down.sql'))
    .sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, 'utf-8');
    
    try {
      await testPool.query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ Error running ${file}:`, error);
      throw error;
    }
  }
}

export default async function globalSetup() {
  try {
    console.log('\n🔧 Setting up test environment...\n');
    
    // Check database connection
    await testPool.query('SELECT 1');
    console.log('✓ Test database connected');
    
    // Run migrations
    await runMigrations();
    
    console.log('\n✓ Test environment ready!\n');
  } catch (error) {
    console.error('\n❌ Failed to setup test environment:', error);
    throw error;
  }
}