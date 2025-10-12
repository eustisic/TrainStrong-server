import { clearMockDatabase, setupTestDatabase } from './setup/mockDatabase.js';

// Setup mock database
setupTestDatabase();

// Clear database before each test
beforeEach(async () => {
  clearMockDatabase();
  setupTestDatabase();
});

// Increase timeout for operations
jest.setTimeout(30000);