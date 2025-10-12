import pool from '../db.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'myapp';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';

  // Connect to postgres database to create our app database
  const { Pool } = await import('pg');
  const setupPool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: parseInt(dbPort),
    database: 'postgres' // Connect to default postgres database
  });

  try {
    // Check if database exists
    const result = await setupPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await setupPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database '${dbName}' created successfully`);
    } else {
      console.log(`✓ Database '${dbName}' already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await setupPool.end();
  }
}

async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const { stdout, stderr } = await execAsync('npm run migrate:up');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function main() {
  console.log('Setting up database...\n');

  try {
    // Step 1: Create database if it doesn't exist
    await createDatabase();

    // Step 2: Check connection
    const connected = await checkDatabaseConnection();
    if (!connected) {
      throw new Error('Could not connect to database');
    }

    // Step 3: Run migrations
    await runMigrations();

    // Step 4: Optionally seed data (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\nWould you like to seed the database? Run: npm run seed');
    }

    console.log('\n✓ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database setup failed:', error);
    process.exit(1);
  }
}

main();