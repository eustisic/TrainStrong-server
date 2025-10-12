-- Drop triggers
DROP TRIGGER IF EXISTS update_food_entries_updated_at ON food_entries;
DROP TRIGGER IF EXISTS update_nutrition_goals_updated_at ON nutrition_goals;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_recent_foods_last_used;
DROP INDEX IF EXISTS idx_user_recent_foods_user_id;
DROP INDEX IF EXISTS idx_food_entries_meal_type;
DROP INDEX IF EXISTS idx_food_entries_user_date;
DROP INDEX IF EXISTS idx_food_entries_consumed_at;
DROP INDEX IF EXISTS idx_food_entries_user_id;
DROP INDEX IF EXISTS idx_nutrition_goals_active;
DROP INDEX IF EXISTS idx_nutrition_goals_user_id;

-- Drop tables
DROP TABLE IF EXISTS user_recent_foods;
DROP TABLE IF EXISTS food_entries;
DROP TABLE IF EXISTS nutrition_goals;
