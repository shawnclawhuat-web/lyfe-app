
-- Enum types
CREATE TYPE candidate_status AS ENUM (
  'applied', 'interview_scheduled', 'interviewed', 'approved',
  'exam_prep', 'licensed', 'active_agent'
);

CREATE TYPE interview_type AS ENUM ('zoom', 'in_person');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Candidates table
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  status candidate_status NOT NULL DEFAULT 'applied',
  assigned_manager_id uuid NOT NULL REFERENCES users(id),
  created_by_id uuid NOT NULL REFERENCES users(id),
  invite_token text UNIQUE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interviews table
CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES users(id),
  scheduled_by_id uuid NOT NULL REFERENCES users(id),
  round_number integer NOT NULL DEFAULT 1,
  type interview_type NOT NULL DEFAULT 'zoom',
  datetime timestamptz NOT NULL,
  location text,
  zoom_link text,
  google_calendar_event_id text,
  status interview_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_manager ON candidates(assigned_manager_id);
CREATE INDEX idx_candidates_created_by ON candidates(created_by_id);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_manager ON interviews(manager_id);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidates
CREATE POLICY "Authenticated users can read candidates"
  ON candidates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert candidates"
  ON candidates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE TO authenticated USING (true);

-- RLS Policies for interviews
CREATE POLICY "Authenticated users can read interviews"
  ON interviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert interviews"
  ON interviews FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update interviews"
  ON interviews FOR UPDATE TO authenticated USING (true);

-- Auto-update updated_at trigger for candidates
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_candidates_updated_at();
;
