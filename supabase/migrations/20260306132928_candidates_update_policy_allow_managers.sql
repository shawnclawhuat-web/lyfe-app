
-- Drop the restrictive update policy and replace with one that allows
-- any authenticated user whose role is manager/director/admin to update any candidate,
-- while agents can still update candidates assigned to them.
DROP POLICY IF EXISTS "candidates_update_own" ON candidates;

CREATE POLICY "candidates_update" ON candidates
FOR UPDATE
USING (
    auth.uid() = assigned_manager_id
    OR auth.uid() = created_by_id
    OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('manager', 'director', 'admin', 'pa')
    )
);
;
