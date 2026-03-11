
-- Fix: Replace the pa_manager_assignments SELECT policy to use auth.jwt() 
-- instead of querying the users table, which causes infinite recursion
-- when the users table's own policy references pa_manager_assignments.

DROP POLICY IF EXISTS "pa_assignments_select" ON "public"."pa_manager_assignments";

CREATE POLICY "pa_assignments_select" ON "public"."pa_manager_assignments"
  FOR SELECT
  USING (
    (pa_id = auth.uid()) 
    OR (manager_id = auth.uid()) 
    OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );
;
