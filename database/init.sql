-- database/init.sql
-- Note: Don't create the database here as it's created by Docker environment variables

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    is_eligible BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_eligible ON users(is_eligible);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_eligible = true) as eligible_users,
    COUNT(*) FILTER (WHERE is_eligible = false) as ineligible_users,
    ROUND(AVG(age), 2) as average_age,
    MIN(age) as min_age,
    MAX(age) as max_age,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as users_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as users_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_this_month
FROM users;

-- Add some comments for documentation
COMMENT ON TABLE users IS 'Stores user information and eligibility status';
COMMENT ON COLUMN users.id IS 'Primary key, auto-incrementing user ID';
COMMENT ON COLUMN users.first_name IS 'User first name, max 50 characters';
COMMENT ON COLUMN users.last_name IS 'User last name, max 50 characters';
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN users.age IS 'Calculated age at time of submission';
COMMENT ON COLUMN users.is_eligible IS 'Whether user is eligible (age >= 18)';