-- -- Create nutrition_goals table
-- CREATE TABLE IF NOT EXISTS nutrition_goals (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   daily_calories INTEGER,
--   daily_protein_g DECIMAL(10, 2),
--   daily_carbs_g DECIMAL(10, 2),
--   daily_fat_g DECIMAL(10, 2),
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT one_active_goal_per_user UNIQUE (user_id, is_active) WHERE is_active = true
-- );

-- Create food_entries table
CREATE TABLE IF NOT EXISTS food_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fdc_id INTEGER NOT NULL,
  food_name VARCHAR(500) NOT NULL,
  data_type VARCHAR(50),
  serving_size DECIMAL(10, 2) NOT NULL,
  serving_unit VARCHAR(100) NOT NULL,
  calories DECIMAL(10, 2),
  protein_g DECIMAL(10, 2),
  carbs_g DECIMAL(10, 2),
  fat_g DECIMAL(10, 2),
  fiber_g DECIMAL(10, 2),
  consumed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -- Create USDA food cache table
-- CREATE TABLE IF NOT EXISTS usda_food_cache (
--   id SERIAL PRIMARY KEY,
--   fdc_id INTEGER NOT NULL UNIQUE,
--   food_data JSONB NOT NULL,
--   data_type VARCHAR(50),
--   last_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create user recent foods table
-- CREATE TABLE IF NOT EXISTS user_recent_foods (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   fdc_id INTEGER NOT NULL,
--   food_name VARCHAR(500) NOT NULL,
--   times_used INTEGER DEFAULT 1,
--   last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   UNIQUE(user_id, fdc_id)
-- );

-- Create indexes for better query performance
-- CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX idx_food_entries_user_id ON food_entries(user_id);
-- CREATE INDEX idx_usda_food_cache_fdc_id ON usda_food_cache(fdc_id);
-- CREATE INDEX idx_user_recent_foods_user_id ON user_recent_foods(user_id);

-- Create triggers for updating updated_at
-- CREATE TRIGGER update_nutrition_goals_updated_at BEFORE UPDATE ON nutrition_goals
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_entries_updated_at BEFORE UPDATE ON food_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
