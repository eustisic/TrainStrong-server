import { jest } from '@jest/globals';

// Mock pool for tests
export const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
};

// Mock database responses
export const mockWorkouts = [
  {
    id: 1,
    name: 'Bench Press',
    category: 'strength',
    equipment: 'barbell',
    description: 'Classic chest workout',
    instructions: 'Lower bar to chest and press up',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 10,
      rest_seconds: 60
    },
    is_public: true,
    created_by: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'Running',
    category: 'cardio',
    equipment: 'treadmill',
    description: 'Cardio workout',
    instructions: 'Run at steady pace',
    workout_data: {
      type: 'cardio',
      duration_minutes: 30,
      distance_km: 5
    },
    is_public: true,
    created_by: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

export const mockUsers = [
  {
    id: 1,
    email: 'john@example.com',
    username: 'johndoe',
    password_hash: 'hashed_password_123',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: new Date('1990-01-01'),
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

// Mock query implementation
export function setupMockQuery() {
  mockPool.query.mockImplementation((sql: string, params?: any[]) => {
    // SELECT queries
    if (sql.includes('SELECT * FROM workouts WHERE id = $1')) {
      const id = params?.[0];
      const workout = mockWorkouts.find(e => e.id === id);
      return Promise.resolve({ rows: workout ? [workout] : [], rowCount: workout ? 1 : 0 });
    }
    
    if (sql.includes('SELECT * FROM workouts WHERE category = $1')) {
      const category = params?.[0];
      const workouts = mockWorkouts.filter(e => e.category === category && e.is_public);
      return Promise.resolve({ rows: workouts, rowCount: workouts.length });
    }
    
    if (sql.includes('SELECT * FROM workouts WHERE is_public = true')) {
      const publicWorkouts = mockWorkouts.filter(e => e.is_public);
      return Promise.resolve({ rows: publicWorkouts, rowCount: publicWorkouts.length });
    }
    
    if (sql.includes('SELECT * FROM workouts') && sql.includes('ILIKE')) {
      const searchTerm = params?.[0]?.replace('%', '');
      const workouts = mockWorkouts.filter(e => 
        e.name.toLowerCase().includes(searchTerm?.toLowerCase() || '') && e.is_public
      );
      return Promise.resolve({ rows: workouts, rowCount: workouts.length });
    }
    
    // INSERT queries
    if (sql.includes('INSERT INTO workouts')) {
      const newWorkout = {
        id: mockWorkouts.length + 1,
        name: params?.[0],
        category: params?.[1],
        equipment: params?.[2],
        description: params?.[3],
        instructions: params?.[4],
        workout_data: JSON.parse(params?.[5] || '{}'),
        created_by: params?.[6],
        is_public: params?.[7] ?? true,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockWorkouts.push(newWorkout);
      return Promise.resolve({ rows: [newWorkout], rowCount: 1 });
    }
    
    if (sql.includes('INSERT INTO users')) {
      const newUser = {
        id: mockUsers.length + 1,
        email: params?.[0],
        username: params?.[1],
        password_hash: params?.[2],
        first_name: params?.[3],
        last_name: params?.[4],
        date_of_birth: params?.[5],
        created_at: new Date(),
        updated_at: new Date()
      };
      mockUsers.push(newUser);
      return Promise.resolve({ rows: [newUser], rowCount: 1 });
    }
    
    // UPDATE queries
    if (sql.includes('UPDATE workouts')) {
      const id = params?.[params.length - 1];
      const workout = mockWorkouts.find(e => e.id === id);
      if (workout) {
        // Parse the SET clause to update fields
        const updated = { ...workout, updated_at: new Date() };
        return Promise.resolve({ rows: [updated], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    
    // DELETE queries
    if (sql.includes('DELETE FROM workouts')) {
      const id = params?.[0];
      const index = mockWorkouts.findIndex(e => e.id === id);
      if (index !== -1) {
        mockWorkouts.splice(index, 1);
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    
    if (sql.includes('DELETE FROM')) {
      // Generic delete for clearing database
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    
    if (sql.includes('ALTER SEQUENCE')) {
      // Sequence reset
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    
    // Default response
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
}

export function clearMockDatabase() {
  mockWorkouts.length = 0;
  mockUsers.length = 0;
  mockPool.query.mockClear();
}

export function setupTestDatabase() {
  process.env.NODE_ENV = 'test';
  setupMockQuery();
  return mockPool;
}