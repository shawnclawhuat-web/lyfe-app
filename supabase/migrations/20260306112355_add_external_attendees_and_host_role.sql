ALTER TABLE events ADD COLUMN IF NOT EXISTS external_attendees jsonb NOT NULL DEFAULT '[]';;
