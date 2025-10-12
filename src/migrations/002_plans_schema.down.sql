-- Drop triggers
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
DROP TRIGGER IF EXISTS update_plan_workouts_updated_at ON plan_workouts;
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;

-- Drop indexes
DROP INDEX IF EXISTS idx_scheduled_workouts_plan_id;
DROP INDEX IF EXISTS idx_scheduled_workouts_user_plan_id;
DROP INDEX IF EXISTS idx_user_plans_status;
DROP INDEX IF EXISTS idx_user_plans_plan_id;
DROP INDEX IF EXISTS idx_user_plans_user_id;
DROP INDEX IF EXISTS idx_plan_workouts_workout_id;
DROP INDEX IF EXISTS idx_plan_workouts_plan_id;
DROP INDEX IF EXISTS idx_plans_is_public;
DROP INDEX IF EXISTS idx_plans_created_by;

-- Drop constraint from scheduled_workouts table
ALTER TABLE scheduled_workouts DROP CONSTRAINT IF EXISTS unique_plan_workout;

-- Remove plan-related columns from scheduled_workouts table
ALTER TABLE scheduled_workouts
DROP COLUMN IF EXISTS plan_workout_id,
DROP COLUMN IF EXISTS user_plan_id,
DROP COLUMN IF EXISTS plan_id;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS user_plans;
DROP TABLE IF EXISTS plan_workouts;
DROP TABLE IF EXISTS plans;