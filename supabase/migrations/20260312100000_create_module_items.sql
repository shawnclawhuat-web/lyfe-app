-- ============================================================================
-- Module Items & Item-Level Progress
-- ============================================================================
-- Adds sub-items to modules (materials, pre-quiz, quiz, exam, attendance)
-- and per-candidate item-level progress tracking.
-- ============================================================================

-- Module items (e.g. "Pre-Class Reading", "Module Quiz", "Attendance")
CREATE TABLE roadmap_module_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id           UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE CASCADE,
    item_type           TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    display_order       INT NOT NULL DEFAULT 0,
    is_required         BOOLEAN NOT NULL DEFAULT true,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    icon_name           TEXT,
    resource_url        TEXT,
    resource_type       TEXT,
    exam_paper_id       UUID REFERENCES exam_papers(id) ON DELETE SET NULL,
    pass_percentage     INT,
    time_limit_minutes  INT,
    archived_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_item_type CHECK (
        item_type IN ('material', 'pre_quiz', 'quiz', 'exam', 'attendance')
    ),
    CONSTRAINT valid_resource_type CHECK (
        resource_type IS NULL OR resource_type IN ('link', 'file', 'video', 'text')
    )
);

CREATE INDEX idx_module_items_module ON roadmap_module_items(module_id, display_order);

-- Candidate progress per module item
CREATE TABLE candidate_module_item_progress (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    module_item_id      UUID NOT NULL REFERENCES roadmap_module_items(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'not_started',
    completed_at        TIMESTAMPTZ,
    completed_by        UUID REFERENCES users(id),
    score               NUMERIC,
    attempt_count       INT NOT NULL DEFAULT 0,
    notes               TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(candidate_id, module_item_id),
    CONSTRAINT valid_item_progress_status CHECK (
        status IN ('not_started', 'in_progress', 'completed')
    )
);

CREATE INDEX idx_item_progress_candidate ON candidate_module_item_progress(candidate_id);
CREATE INDEX idx_item_progress_item ON candidate_module_item_progress(module_item_id);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER roadmap_module_items_updated_at
    BEFORE UPDATE ON roadmap_module_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER candidate_module_item_progress_updated_at
    BEFORE UPDATE ON candidate_module_item_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE roadmap_module_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_module_item_progress ENABLE ROW LEVEL SECURITY;

-- Module items: authenticated can read active
CREATE POLICY "Read active module items"
    ON roadmap_module_items FOR SELECT TO authenticated
    USING (is_active = true AND archived_at IS NULL);

-- Item progress: authenticated users can read and manage
CREATE POLICY "Manage item progress"
    ON candidate_module_item_progress FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
