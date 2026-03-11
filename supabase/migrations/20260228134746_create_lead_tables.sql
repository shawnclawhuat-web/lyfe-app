
-- Lead status enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposed', 'won', 'lost');

-- Lead source enum
CREATE TYPE lead_source AS ENUM ('referral', 'walk_in', 'online', 'event', 'cold_call', 'other');

-- Product interest enum
CREATE TYPE product_interest AS ENUM ('life', 'health', 'ilp', 'general');

-- Lead activity type enum (extensible per FMEA #4.1)
CREATE TYPE lead_activity_type AS ENUM ('created', 'note', 'call', 'status_change', 'reassignment', 'email', 'meeting', 'follow_up');

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID NOT NULL REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source lead_source DEFAULT 'other',
  source_name TEXT, -- for external integrations
  external_id TEXT, -- for dedup (FMEA #4.2)
  status lead_status NOT NULL DEFAULT 'new',
  product_interest product_interest DEFAULT 'general',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(external_id, source_name) -- dedup constraint (FMEA #4.2)
);

-- Lead activities table (flexible type + metadata JSONB per FMEA #4.1)
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type lead_activity_type NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read leads (team filtering done in app)
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read activities" ON lead_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert activities" ON lead_activities
  FOR INSERT TO authenticated WITH CHECK (true);
;
