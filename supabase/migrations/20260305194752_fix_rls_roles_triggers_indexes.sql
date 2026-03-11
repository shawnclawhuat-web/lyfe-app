
-- ============================================================
-- 1. Fix RLS policies: {public} → {authenticated}
--    Drop and recreate each affected policy.
-- ============================================================

-- exam_attempts
DROP POLICY IF EXISTS exam_attempts_insert_own ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_select_own ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_select_team ON public.exam_attempts;
DROP POLICY IF EXISTS exam_attempts_update_own ON public.exam_attempts;

CREATE POLICY exam_attempts_insert_own ON public.exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY exam_attempts_select_own ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY exam_attempts_select_team ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT get_team_member_ids(auth.uid())));

CREATE POLICY exam_attempts_update_own ON public.exam_attempts
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) AND (status = 'in_progress'));

-- exam_answers
DROP POLICY IF EXISTS exam_answers_insert_own ON public.exam_answers;
DROP POLICY IF EXISTS exam_answers_select_own ON public.exam_answers;
DROP POLICY IF EXISTS exam_answers_update_own ON public.exam_answers;

CREATE POLICY exam_answers_insert_own ON public.exam_answers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
      AND exam_attempts.status = 'in_progress'
  ));

CREATE POLICY exam_answers_select_own ON public.exam_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
  ));

CREATE POLICY exam_answers_update_own ON public.exam_answers
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
      AND exam_attempts.status = 'in_progress'
  ));

-- exam_papers
DROP POLICY IF EXISTS exam_papers_admin ON public.exam_papers;
DROP POLICY IF EXISTS exam_papers_select ON public.exam_papers;

CREATE POLICY exam_papers_admin ON public.exam_papers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY exam_papers_select ON public.exam_papers
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- exam_questions
DROP POLICY IF EXISTS exam_questions_admin ON public.exam_questions;
DROP POLICY IF EXISTS exam_questions_select ON public.exam_questions;

CREATE POLICY exam_questions_admin ON public.exam_questions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY exam_questions_select ON public.exam_questions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- invite_tokens
DROP POLICY IF EXISTS invite_tokens_insert ON public.invite_tokens;
DROP POLICY IF EXISTS invite_tokens_select ON public.invite_tokens;

CREATE POLICY invite_tokens_insert ON public.invite_tokens
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role = ANY (ARRAY['pa'::user_role, 'admin'::user_role, 'director'::user_role, 'manager'::user_role])
  ));

CREATE POLICY invite_tokens_select ON public.invite_tokens
  FOR SELECT TO authenticated
  USING (
    (created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- pa_manager_assignments
DROP POLICY IF EXISTS pa_assignments_select ON public.pa_manager_assignments;

CREATE POLICY pa_assignments_select ON public.pa_manager_assignments
  FOR SELECT TO authenticated
  USING (
    pa_id = auth.uid()
    OR manager_id = auth.uid()
    OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- users
DROP POLICY IF EXISTS users_insert_self ON public.users;
DROP POLICY IF EXISTS users_insert_admin ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_admin ON public.users;
DROP POLICY IF EXISTS users_select_team ON public.users;
DROP POLICY IF EXISTS users_select_pa ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_update_admin ON public.users;

CREATE POLICY users_insert_self ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_admin ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_select_admin ON public.users
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY users_select_team ON public.users
  FOR SELECT TO authenticated
  USING (reports_to = auth.uid());

CREATE POLICY users_select_pa ON public.users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pa_manager_assignments
    WHERE pa_manager_assignments.pa_id = auth.uid()
      AND pa_manager_assignments.manager_id = users.id
  ));

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_update_admin ON public.users
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- ============================================================
-- 2. Add missing updated_at triggers for leads and interviews
-- ============================================================

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 3. Add missing FK indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_reports_to ON public.users(reports_to);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_candidates_assigned_manager_id ON public.candidates(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created_by_id ON public.candidates(created_by_id);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_manager_id ON public.interviews(manager_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_by_id ON public.interviews(scheduled_by_id);

CREATE INDEX IF NOT EXISTS idx_exam_questions_paper_id ON public.exam_questions(paper_id);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON public.exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_paper_id ON public.exam_attempts(paper_id);

CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_id ON public.exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_question_id ON public.exam_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_pa_manager_assignments_pa_id ON public.pa_manager_assignments(pa_id);
CREATE INDEX IF NOT EXISTS idx_pa_manager_assignments_manager_id ON public.pa_manager_assignments(manager_id);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by ON public.invite_tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_consumed_by ON public.invite_tokens(consumed_by);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_assigned_manager_id ON public.invite_tokens(assigned_manager_id);
;
