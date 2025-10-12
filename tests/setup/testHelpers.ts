import { testPool } from './testDatabase.js';
import { 
  CreateUserInput, 
  CreateWorkoutInput, 
  CreatePlanInput,
  User,
  Workout,
  Plan,
  WorkoutData
} from '../../src/types/database.types.js';

// Test data factories
export const testUsers = {
  john: {
    email: 'john@example.com',
    username: 'johndoe',
    password_hash: 'hashed_password_123',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: new Date('1990-01-01')
  } as CreateUserInput,
  
  jane: {
    email: 'jane@example.com',
    username: 'janedoe',
    password_hash: 'hashed_password_456',
    first_name: 'Jane',
    last_name: 'Doe',
    date_of_birth: new Date('1992-05-15')
  } as CreateUserInput
};

export const testWorkouts = {
  pushups: {
    name: 'Test Push-ups',
    category: 'strength',
    equipment: 'bodyweight',
    description: 'Test push-up workout',
    instructions: 'Do push-ups for testing',
    workout_data: {
      type: 'strength',
      sets: 3,
      reps: 10,
      rest_seconds: 60
    } as WorkoutData,
    is_public: true
  } as CreateWorkoutInput,
  
  running: {
    name: 'Test Running',
    category: 'cardio',
    equipment: 'treadmill',
    description: 'Test running workout',
    instructions: 'Run on treadmill for testing',
    workout_data: {
      type: 'cardio',
      duration_minutes: 30,
      distance_km: 5,
      pace: '6:00/km'
    } as WorkoutData,
    is_public: true
  } as CreateWorkoutInput,
  
  stretching: {
    name: 'Test Stretching',
    category: 'flexibility',
    equipment: 'mat',
    description: 'Test stretching workout',
    instructions: 'Stretch for testing',
    workout_data: {
      type: 'flexibility',
      duration_seconds: 300,
      hold_count: 5
    } as WorkoutData,
    is_public: true
  } as CreateWorkoutInput
};

export const testPlans = {
  beginnerPlan: {
    name: 'Test Beginner Plan',
    description: 'A test plan for beginners',
    duration_weeks: 4,
    is_public: true
  } as CreatePlanInput,
  
  advancedPlan: {
    name: 'Test Advanced Plan',
    description: 'A test plan for advanced users',
    duration_weeks: 8,
    is_public: false
  } as CreatePlanInput
};

// Database helper functions
export async function createTestUser(userData: CreateUserInput = testUsers.john): Promise<User> {
  const result = await testPool.query(
    `INSERT INTO users (email, username, password_hash, first_name, last_name, date_of_birth)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userData.email, userData.username, userData.password_hash, 
     userData.first_name, userData.last_name, userData.date_of_birth]
  );
  return result.rows[0];
}

export async function createTestWorkout(
  workoutData: CreateWorkoutInput = testWorkouts.pushups,
  createdBy?: number
): Promise<Workout> {
  const result = await testPool.query(
    `INSERT INTO workouts (name, category, equipment, description, instructions, workout_data, created_by, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [workoutData.name, workoutData.category, workoutData.equipment,
     workoutData.description, workoutData.instructions, 
     JSON.stringify(workoutData.workout_data), createdBy, workoutData.is_public]
  );
  return result.rows[0];
}

export async function createTestPlan(
  planData: CreatePlanInput = testPlans.beginnerPlan,
  createdBy?: number
): Promise<Plan> {
  const result = await testPool.query(
    `INSERT INTO plans (name, description, duration_weeks, created_by, is_public)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [planData.name, planData.description, planData.duration_weeks, 
     createdBy, planData.is_public]
  );
  return result.rows[0];
}

// Request helper for authenticated requests
export function authenticatedRequest(userId: number) {
  return {
    user: { id: userId }
  };
}

// Assertion helpers
export function expectWorkout(actual: any, expected: Partial<Workout>) {
  if (expected.name) expect(actual.name).toBe(expected.name);
  if (expected.category) expect(actual.category).toBe(expected.category);
  if (expected.equipment) expect(actual.equipment).toBe(expected.equipment);
  if (expected.description) expect(actual.description).toBe(expected.description);
  if (expected.instructions) expect(actual.instructions).toBe(expected.instructions);
  if (expected.is_public !== undefined) expect(actual.is_public).toBe(expected.is_public);
  expect(actual).toHaveProperty('id');
  expect(actual).toHaveProperty('created_at');
  expect(actual).toHaveProperty('updated_at');
}

export function expectPlan(actual: any, expected: Partial<Plan>) {
  if (expected.name) expect(actual.name).toBe(expected.name);
  if (expected.description) expect(actual.description).toBe(expected.description);
  if (expected.duration_weeks) expect(actual.duration_weeks).toBe(expected.duration_weeks);
  if (expected.is_public !== undefined) expect(actual.is_public).toBe(expected.is_public);
  expect(actual).toHaveProperty('id');
  expect(actual).toHaveProperty('created_at');
  expect(actual).toHaveProperty('updated_at');
}

export function expectWorkout(actual: any) {
  expect(actual).toHaveProperty('id');
  expect(actual).toHaveProperty('user_id');
  expect(actual).toHaveProperty('workout_id');
  expect(actual).toHaveProperty('completed_workout_data');
  expect(actual).toHaveProperty('performed_at');
  expect(actual).toHaveProperty('created_at');
  expect(actual).toHaveProperty('updated_at');
}

// Wait helper for async operations
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}