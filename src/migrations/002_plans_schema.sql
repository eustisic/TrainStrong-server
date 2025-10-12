-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  created_by INTEGER REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_workouts table
CREATE TABLE IF NOT EXISTS plan_workouts (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  week_day INTEGER NOT NULL CHECK (week_day >= 0 AND week_day <= 6),
  week_offset INTEGER NOT NULL DEFAULT 0 CHECK (week_offset >= 0),
  workout_order INTEGER NOT NULL DEFAULT 1,
  workout_data_override JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, week_day, week_offset, workout_order)
);

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, plan_id, start_date)
);

-- Add plan-related columns to scheduled_workouts table
ALTER TABLE scheduled_workouts
ADD COLUMN plan_id INTEGER REFERENCES plans(id),
ADD COLUMN user_plan_id INTEGER REFERENCES user_plans(id) ON DELETE CASCADE,
ADD COLUMN plan_workout_id INTEGER REFERENCES plan_workouts(id);

-- Add unique constraint for idempotent plan scheduled workouts
ALTER TABLE scheduled_workouts
ADD CONSTRAINT unique_plan_workout 
UNIQUE (user_id, user_plan_id, plan_workout_id, performed_at);

-- Create indexes for better query performance
CREATE INDEX idx_plans_created_by ON plans(created_by);
CREATE INDEX idx_plan_workouts_plan_id ON plan_workouts(plan_id);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_plan_id ON user_plans(plan_id);

-- Create triggers for updating updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_workouts_updated_at BEFORE UPDATE ON plan_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();