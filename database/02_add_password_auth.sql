-- ========================================================
-- Add Password Authentication Support
-- Run this if your database already exists
-- ========================================================

-- Add password_hash column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password_hash';
