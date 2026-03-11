-- Drop old PA-only update policy, replace with broader permissions
DROP POLICY IF EXISTS pa_update_events ON events;
CREATE POLICY update_events ON events
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'pa'
        AND reports_to = events.created_by
    )
  );;
