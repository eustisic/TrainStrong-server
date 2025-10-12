import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(direction: 'up' | 'down') {
  const migrationFiles = await fs.readdir(__dirname);
  const sqlFiles = migrationFiles
    .filter(file => file.endsWith(direction === 'up' ? '.sql' : '.down.sql'))
    .sort();

  if (sqlFiles.length === 0) {
    console.log(`No ${direction} migration files found.`);
    return;
  }

  for (const file of sqlFiles) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(__dirname, file);
    const sql = await fs.readFile(filePath, 'utf-8');

    try {
      await pool.query(sql);
      console.log(`✓ ${file} completed successfully`);
    } catch (error) {
      console.error(`✗ Error running ${file}:`, error);
      throw error;
    }
  }

  console.log(`All ${direction} migrations completed!`);
}

async function main() {
  const command = process.argv[2];

  if (!command || !['up', 'down'].includes(command)) {
    console.error('Usage: npm run migrate:up or npm run migrate:down');
    process.exit(1);
  }

  try {
    await runMigration(command as 'up' | 'down');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();