-- ============================================================================
-- SeedLYFE / SproutLYFE Roadmap Tables (v3)
-- ============================================================================
-- v3 changes:
-- - Added archived_at/archived_by to programmes and modules (soft-delete)
-- - Changed ON DELETE CASCADE to ON DELETE RESTRICT for progress/resource FKs
-- - Added manually_unlocked/unlocked_by/unlocked_at to enrollment
-- - RLS policies filter archived_at IS NULL for candidate-facing queries
-- - Partial index on roadmap_modules for active non-archived filtering
-- ============================================================================

-- Programmes (e.g. SeedLYFE, SproutLYFE)
CREATE TABLE roadmap_programmes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    display_order   INT NOT NULL DEFAULT 0,
    icon_type       TEXT NOT NULL DEFAULT 'seedling',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    archived_at     TIMESTAMPTZ,
    archived_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules within a programme
CREATE TABLE roadmap_modules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id        UUID NOT NULL REFERENCES roadmap_programmes(id) ON DELETE RESTRICT,
    title               TEXT NOT NULL,
    description         TEXT,
    learning_objectives TEXT,
    module_type         TEXT NOT NULL DEFAULT 'training',
    display_order       INT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    is_required         BOOLEAN NOT NULL DEFAULT true,
    estimated_minutes   INT,
    exam_paper_id       UUID REFERENCES exam_papers(id) ON DELETE SET NULL,
    icon_name           TEXT DEFAULT 'book-outline',
    icon_color          TEXT DEFAULT '#007AFF',
    archived_at         TIMESTAMPTZ,
    archived_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_modules_programme ON roadmap_modules(programme_id, display_order);
CREATE INDEX idx_roadmap_modules_active ON roadmap_modules(is_active) WHERE archived_at IS NULL;

-- Resources / content attached to modules
CREATE TABLE roadmap_resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    description     TEXT,
    resource_type   TEXT NOT NULL,
    content_url     TEXT,
    content_text    TEXT,
    display_order   INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roadmap_resources_module ON roadmap_resources(module_id, display_order);

-- Module prerequisites (admin-configurable, none by default)
CREATE TABLE roadmap_prerequisites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id           UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,
    required_module_id  UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(module_id, required_module_id),
    CHECK(module_id != required_module_id)
);

-- Candidate progress per module
CREATE TABLE candidate_module_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    module_id       UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE RESTRICT,
    status          TEXT NOT NULL DEFAULT 'not_started',
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    score           NUMERIC,
    notes           TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, module_id)
);

CREATE INDEX idx_candidate_progress_candidate ON candidate_module_progress(candidate_id);
CREATE INDEX idx_candidate_progress_module ON candidate_module_progress(module_id);

-- Candidate programme enrollment (with manual unlock)
CREATE TABLE candidate_programme_enrollment (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    programme_id        UUID NOT NULL REFERENCES roadmap_programmes(id) ON DELETE RESTRICT,
    status              TEXT NOT NULL DEFAULT 'active',
    manually_unlocked   BOOLEAN NOT NULL DEFAULT false,
    unlocked_by         UUID REFERENCES users(id),
    unlocked_at         TIMESTAMPTZ,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, programme_id)
);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER roadmap_programmes_updated_at
    BEFORE UPDATE ON roadmap_programmes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER roadmap_modules_updated_at
    BEFORE UPDATE ON roadmap_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER candidate_module_progress_updated_at
    BEFORE UPDATE ON candidate_module_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE roadmap_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_programme_enrollment ENABLE ROW LEVEL SECURITY;

-- Programmes: authenticated can read active non-archived
CREATE POLICY "Read active non-archived programmes"
    ON roadmap_programmes FOR SELECT TO authenticated
    USING (is_active = true AND archived_at IS NULL);

-- Modules: authenticated can read active non-archived
CREATE POLICY "Read active non-archived modules"
    ON roadmap_modules FOR SELECT TO authenticated
    USING (is_active = true AND archived_at IS NULL);

-- Resources: authenticated can read active
CREATE POLICY "Read active resources"
    ON roadmap_resources FOR SELECT TO authenticated
    USING (is_active = true);

-- Prerequisites: authenticated can read
CREATE POLICY "Read prerequisites"
    ON roadmap_prerequisites FOR SELECT TO authenticated
    USING (true);

-- Progress: authenticated users can read and manage
CREATE POLICY "Manage candidate progress"
    ON candidate_module_progress FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enrollment: authenticated users can read and manage
CREATE POLICY "Manage enrollment"
    ON candidate_programme_enrollment FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Seed Data
-- ============================================================================

INSERT INTO roadmap_programmes (slug, title, description, display_order, icon_type) VALUES
    ('seedlyfe', 'SeedLYFE', 'Foundation programme for new candidates. Build your core knowledge and professional skills.', 0, 'seedling'),
    ('sproutlyfe', 'SproutLYFE', 'Advanced programme for licensed advisors. Develop your practice and master client engagement.', 1, 'sprout');

-- SeedLYFE modules (10 training + 4 exams)
WITH seed AS (SELECT id FROM roadmap_programmes WHERE slug = 'seedlyfe')
INSERT INTO roadmap_modules (programme_id, title, description, module_type, display_order, icon_name, icon_color, estimated_minutes) VALUES
    ((SELECT id FROM seed), 'VARK', 'Discover your learning style using the VARK framework.', 'training', 0, 'eye-outline', '#007AFF', 30),
    ((SELECT id FROM seed), 'Enneagram', 'Understand your personality type through the Enneagram system.', 'training', 1, 'people-outline', '#AF52DE', 45),
    ((SELECT id FROM seed), 'Personal Branding', 'Craft your professional identity and personal brand.', 'training', 2, 'star-outline', '#FF9500', 40),
    ((SELECT id FROM seed), 'Personal Grooming', 'Master professional presentation standards.', 'training', 3, 'shirt-outline', '#5856D6', 25),
    ((SELECT id FROM seed), 'Tax', 'Singapore tax fundamentals relevant to financial planning.', 'training', 4, 'calculator-outline', '#34C759', 60),
    ((SELECT id FROM seed), 'CPF', 'Master the Central Provident Fund system.', 'training', 5, 'wallet-outline', '#007AFF', 55),
    ((SELECT id FROM seed), 'MAP Calculation / Credit System', 'Monthly Allowance Programme and credit system.', 'training', 6, 'trending-up-outline', '#FF9500', 35),
    ((SELECT id FROM seed), 'Telemarketing', 'Effective telephone prospecting skills.', 'training', 7, 'call-outline', '#34C759', 50),
    ((SELECT id FROM seed), 'Money Instruments', 'Overview of financial instruments.', 'training', 8, 'cash-outline', '#5856D6', 45),
    ((SELECT id FROM seed), 'Prospecting / MySeminar', 'Prospecting strategies and MySeminar system.', 'training', 9, 'megaphone-outline', '#FF3B30', 50),
    ((SELECT id FROM seed), 'RES5 Exam', 'Rules and Ethics of Financial Advisory Services.', 'exam', 10, 'school-outline', '#FF9500', 120),
    ((SELECT id FROM seed), 'M9 Exam', 'Life Insurance and Investment-Linked Policies.', 'exam', 11, 'school-outline', '#FF9500', 120),
    ((SELECT id FROM seed), 'M9A Exam', 'Health Insurance Module.', 'exam', 12, 'school-outline', '#FF9500', 90),
    ((SELECT id FROM seed), 'HI Exam', 'Health Insurance.', 'exam', 13, 'school-outline', '#FF9500', 90);

-- SproutLYFE modules (11 training)
WITH sprout AS (SELECT id FROM roadmap_programmes WHERE slug = 'sproutlyfe')
INSERT INTO roadmap_modules (programme_id, title, description, module_type, display_order, icon_name, icon_color, estimated_minutes) VALUES
    ((SELECT id FROM sprout), 'Project 100 / First 9 in 90', 'Launch your practice with the Project 100 framework.', 'training', 0, 'rocket-outline', '#FF3B30', 60),
    ((SELECT id FROM sprout), 'Business Ethics', 'Ethical standards in financial advisory.', 'training', 1, 'shield-checkmark-outline', '#007AFF', 40),
    ((SELECT id FROM sprout), 'MAP Calculation / Credit System', 'Advanced MAP and credit system mastery.', 'training', 2, 'trending-up-outline', '#34C759', 45),
    ((SELECT id FROM sprout), 'Goal Setting', 'Strategic goal-setting for your advisory career.', 'training', 3, 'flag-outline', '#AF52DE', 35),
    ((SELECT id FROM sprout), 'PAC / PW', 'Prudential Assurance Company and PruWealth product training.', 'training', 4, 'briefcase-outline', '#FF9500', 50),
    ((SELECT id FROM sprout), 'PVA / PVW', 'PruVantage advanced ILP and wealth accumulation solutions.', 'training', 5, 'bar-chart-outline', '#5856D6', 50),
    ((SELECT id FROM sprout), 'PIIB / PILI', 'Prudential income and legacy products.', 'training', 6, 'umbrella-outline', '#007AFF', 45),
    ((SELECT id FROM sprout), 'Whole Life / Term / Pruman / PruLady', 'Core life insurance product suite.', 'training', 7, 'heart-outline', '#FF3B30', 55),
    ((SELECT id FROM sprout), 'Prushield + PA', 'Health insurance product mastery.', 'training', 8, 'medkit-outline', '#34C759', 50),
    ((SELECT id FROM sprout), 'Roadshow / Prospecting', 'Advanced roadshow execution and prospecting.', 'training', 9, 'storefront-outline', '#FF9500', 45),
    ((SELECT id FROM sprout), 'Financial Planning Concepts', 'Holistic financial planning framework.', 'training', 10, 'analytics-outline', '#5856D6', 60);
