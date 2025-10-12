import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create a separate pool for tests
export const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'myapp_test',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function clearDatabase() {
  try {
    // Clear all data in reverse dependency order
    await testPool.query('DELETE FROM workouts');
    await testPool.query('DELETE FROM user_plans');
    await testPool.query('DELETE FROM plan_workouts');
    await testPool.query('DELETE FROM plans');
    await testPool.query('DELETE FROM workouts');
    await testPool.query('DELETE FROM users');
    
    // Reset sequences
    await testPool.query('ALTER SEQUENCE workouts_id_seq RESTART WITH 1');
    await testPool.query('ALTER SEQUENCE user_plans_id_seq RESTART WITH 1');
    await testPool.query('ALTER SEQUENCE plan_workouts_id_seq RESTART WITH 1');
    await testPool.query('ALTER SEQUENCE plans_id_seq RESTART WITH 1');
    await testPool.query('ALTER SEQUENCE workouts_id_seq RESTART WITH 1');
    await testPool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await testPool.end();
}

// Test transaction helpers
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Override the default pool for tests
export function setupTestDatabase() {
  // This will be imported by test files to ensure they use the test database
  process.env.NODE_ENV = 'test';
  return testPool;
}