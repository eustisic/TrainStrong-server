-- Drop triggers
DROP TRIGGER IF EXISTS update_scheduled_workouts_updated_at ON scheduled_workouts;
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_workouts_category;
DROP INDEX IF EXISTS idx_scheduled_workouts_performed_at;
DROP INDEX IF EXISTS idx_scheduled_workouts_workout_id;
DROP INDEX IF EXISTS idx_scheduled_workouts_user_id;

-- Drop tables
DROP TABLE IF EXISTS scheduled_workouts;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS users;