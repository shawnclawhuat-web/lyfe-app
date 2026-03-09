-- Add onboarding_complete column to users table
-- New users default to false (must complete onboarding flow)
-- Existing users are marked as complete (they skip onboarding)

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Mark all existing users as having completed onboarding
UPDATE users SET onboarding_complete = true WHERE created_at < NOW();
