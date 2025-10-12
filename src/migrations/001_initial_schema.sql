-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  equipment VARCHAR(100),
  description TEXT,
  instructions TEXT,
  workout_data JSONB NOT NULL DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scheduled_workouts table
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  completed_workout_data JSONB NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  completion_state VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('complete', 'incomplete', 'pending')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX idx_scheduled_workouts_workout_id ON scheduled_workouts(workout_id);
CREATE INDEX idx_scheduled_workouts_performed_at ON scheduled_workouts(performed_at);
CREATE INDEX idx_workouts_category ON workouts(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_workouts_updated_at BEFORE UPDATE ON scheduled_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();