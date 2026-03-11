
DROP POLICY IF EXISTS "interviews_update_own" ON interviews;

CREATE POLICY "interviews_update" ON interviews
FOR UPDATE
USING (
    auth.uid() = manager_id
    OR auth.uid() = scheduled_by_id
    OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('manager', 'director', 'admin', 'pa')
    )
);
;
