
-- ============================================================
-- Phase 1: Harden RLS Policies
-- Drop overly permissive INSERT/UPDATE policies and replace
-- with ownership-based checks.
-- ============================================================

-- ── leads ────────────────────────────────────────────────────

-- INSERT: only allow inserting leads where created_by = current user
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
CREATE POLICY "leads_insert_own" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: only allow updating leads assigned to or created by current user
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
CREATE POLICY "leads_update_own" ON public.leads
  FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- ── lead_activities ──────────────────────────────────────────

-- INSERT: only allow inserting activities where user_id = current user
DROP POLICY IF EXISTS "Authenticated users can insert activities" ON public.lead_activities;
CREATE POLICY "lead_activities_insert_own" ON public.lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── candidates ───────────────────────────────────────────────

-- INSERT: only allow inserting candidates where created_by_id = current user
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON public.candidates;
CREATE POLICY "candidates_insert_own" ON public.candidates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by_id);

-- UPDATE: only allow updating candidates managed or created by current user
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;
CREATE POLICY "candidates_update_own" ON public.candidates
  FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_manager_id OR auth.uid() = created_by_id);

-- ── interviews ───────────────────────────────────────────────

-- INSERT: only allow inserting interviews where scheduled_by_id = current user
DROP POLICY IF EXISTS "Authenticated users can insert interviews" ON public.interviews;
CREATE POLICY "interviews_insert_own" ON public.interviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = scheduled_by_id);

-- UPDATE: only allow updating interviews managed or scheduled by current user
DROP POLICY IF EXISTS "Authenticated users can update interviews" ON public.interviews;
CREATE POLICY "interviews_update_own" ON public.interviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = manager_id OR auth.uid() = scheduled_by_id);
;
