-- Notification system foundation: preferences column + performance indexes
-- ============================================================================

-- 1. Add notification preferences to users (JSONB map of type → boolean)
--    Default empty = all enabled. Set a key to false to opt out of push for that type.
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences jsonb
    DEFAULT '{}'::jsonb;

-- 2. Performance indexes for scheduled notification queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_interviews_datetime ON interviews(datetime);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);
