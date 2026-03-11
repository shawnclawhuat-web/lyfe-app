
-- push_token column on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token text;

-- roadshow_configs
CREATE TABLE IF NOT EXISTS roadshow_configs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  weekly_cost           numeric(10,2) NOT NULL,
  slots_per_day         int NOT NULL DEFAULT 3,
  expected_start_time   time NOT NULL,
  late_grace_minutes    int NOT NULL DEFAULT 15,
  suggested_sitdowns    int NOT NULL DEFAULT 5,
  suggested_pitches     int NOT NULL DEFAULT 3,
  suggested_closed      int NOT NULL DEFAULT 1,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

-- roadshow_attendance
CREATE TABLE IF NOT EXISTS roadshow_attendance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at       timestamptz NOT NULL DEFAULT now(),
  late_reason         text,
  checked_in_by       uuid REFERENCES users(id),
  pledged_sitdowns    int NOT NULL DEFAULT 0,
  pledged_pitches     int NOT NULL DEFAULT 0,
  pledged_closed      int NOT NULL DEFAULT 0,
  pledged_afyc        numeric(12,2) NOT NULL DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- roadshow_activities
CREATE TABLE IF NOT EXISTS roadshow_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('sitdown', 'pitch', 'case_closed')),
  afyc_amount numeric(12,2),
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS roadshow_activities_event_user_idx ON roadshow_activities (event_id, user_id);

-- RLS
ALTER TABLE roadshow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadshow_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadshow_activities ENABLE ROW LEVEL SECURITY;

-- roadshow_configs policies
CREATE POLICY "roadshow_configs_select" ON roadshow_configs
  FOR SELECT USING (
    event_id IN (SELECT event_id FROM event_attendees WHERE user_id = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

CREATE POLICY "roadshow_configs_insert" ON roadshow_configs
  FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

CREATE POLICY "roadshow_configs_update" ON roadshow_configs
  FOR UPDATE USING (
    event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

-- roadshow_attendance policies
CREATE POLICY "roadshow_attendance_select" ON roadshow_attendance
  FOR SELECT USING (
    event_id IN (SELECT event_id FROM event_attendees WHERE user_id = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

CREATE POLICY "roadshow_attendance_insert" ON roadshow_attendance
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (
      checked_in_by = auth.uid()
      AND event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
    )
  );

-- roadshow_activities policies
CREATE POLICY "roadshow_activities_select" ON roadshow_activities
  FOR SELECT USING (
    event_id IN (SELECT event_id FROM event_attendees WHERE user_id = auth.uid())
    OR event_id IN (SELECT id FROM events WHERE created_by = auth.uid())
  );

CREATE POLICY "roadshow_activities_insert" ON roadshow_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());
;
