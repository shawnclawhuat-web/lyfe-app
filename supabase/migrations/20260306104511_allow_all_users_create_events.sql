-- Allow any authenticated user to insert events (was pa/admin only)
DROP POLICY IF EXISTS pa_insert_events ON events;
CREATE POLICY authenticated_insert_events ON events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow event creators (in addition to pa/admin) to manage attendees
DROP POLICY IF EXISTS pa_manage_attendees ON event_attendees;
CREATE POLICY manage_attendees ON event_attendees
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pa', 'admin'))
    OR
    EXISTS (SELECT 1 FROM events WHERE id = event_attendees.event_id AND created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pa', 'admin'))
    OR
    EXISTS (SELECT 1 FROM events WHERE id = event_attendees.event_id AND created_by = auth.uid())
  );;
