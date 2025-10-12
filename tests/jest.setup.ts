import { clearDatabase, setupTestDatabase } from './setup/testDatabase.js';

// Setup test database
setupTestDatabase();

// Clear database before each test
beforeEach(async () => {
  await clearDatabase();
});

// Increase timeout for database operations
jest.setTimeout(30000);