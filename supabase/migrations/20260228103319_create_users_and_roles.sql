
-- Enum for user roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'director',
  'manager',
  'agent',
  'pa',
  'candidate'
);

-- Enum for candidate lifecycle stage
CREATE TYPE lifecycle_stage AS ENUM (
  'applied',
  'interview_scheduled',
  'interviewed',
  'approved',
  'exam_prep',
  'licensed',
  'active_agent'
);

-- Core users table (linked to Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'candidate',
  reports_to UUID REFERENCES public.users(id),
  lifecycle_stage lifecycle_stage,
  date_of_birth DATE,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PA ↔ Manager assignments (many-to-many)
CREATE TABLE public.pa_manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pa_id UUID NOT NULL REFERENCES public.users(id),
  manager_id UUID NOT NULL REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pa_id, manager_id)
);

-- Invite tokens for candidate self-registration
CREATE TABLE public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  intended_role user_role NOT NULL DEFAULT 'candidate',
  assigned_manager_id UUID REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  consumed_by UUID REFERENCES public.users(id),
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pa_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_users_reports_to ON public.users(reports_to);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_invite_tokens_token ON public.invite_tokens(token);

-- Function to get all team members (recursive hierarchy traversal)
CREATE OR REPLACE FUNCTION get_team_member_ids(superior_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE team AS (
    SELECT id FROM public.users WHERE reports_to = superior_id AND is_active = true
    UNION ALL
    SELECT u.id FROM public.users u INNER JOIN team t ON u.reports_to = t.id WHERE u.is_active = true
  )
  SELECT id FROM team;
$$;

-- RLS Policies for users table

-- Users can read their own record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all users
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Directors and Managers can read their team members
CREATE POLICY "users_select_team" ON public.users
  FOR SELECT USING (
    id IN (SELECT get_team_member_ids(auth.uid()))
  );

-- PA can read managers they're assigned to and candidates they created
CREATE POLICY "users_select_pa" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pa_manager_assignments
      WHERE pa_id = auth.uid() AND manager_id = public.users.id
    )
  );

-- Users can update their own record (limited fields handled by app)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admin can update any user
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can insert users
CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow new users to create their own profile on registration
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for pa_manager_assignments
CREATE POLICY "pa_assignments_select" ON public.pa_manager_assignments
  FOR SELECT USING (
    pa_id = auth.uid()
    OR manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for invite_tokens
CREATE POLICY "invite_tokens_select" ON public.invite_tokens
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "invite_tokens_insert" ON public.invite_tokens
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('pa', 'admin', 'director', 'manager'))
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
;
