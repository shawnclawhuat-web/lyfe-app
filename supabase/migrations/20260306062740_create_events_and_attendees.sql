
-- Event type enum
CREATE TYPE event_type AS ENUM (
  'team_meeting', 'training', 'agency_event', 'roadshow', 'other'
);

-- Events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'other',
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event attendees (many-to-many: events <-> users)
CREATE TABLE event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  attendee_role text NOT NULL DEFAULT 'attendee'
    CHECK (attendee_role IN ('attendee', 'duty_manager', 'presenter')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all events
CREATE POLICY "read_events" ON events FOR SELECT TO authenticated USING (true);

-- Only PA and admin can insert events
CREATE POLICY "pa_insert_events" ON events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pa', 'admin'))
  );

-- PA and admin can update their own events
CREATE POLICY "pa_update_events" ON events FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Attendees: authenticated users can read
CREATE POLICY "read_event_attendees" ON event_attendees FOR SELECT TO authenticated USING (true);

-- PA and admin can manage attendees
CREATE POLICY "pa_manage_attendees" ON event_attendees FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pa', 'admin'))
  );
;
