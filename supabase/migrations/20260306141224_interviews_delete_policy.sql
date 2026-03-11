
CREATE POLICY "interviews_delete" ON interviews
FOR DELETE
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
