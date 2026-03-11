-- ============================================================================
-- Migrate roadmap_resources → roadmap_module_items
-- ============================================================================
-- Copies all existing roadmap_resources into roadmap_module_items with
-- item_type = 'material'. Uses ON CONFLICT to ensure idempotency.
-- The old roadmap_resources table is kept as a backup (not dropped).
-- ============================================================================

BEGIN;

-- Use the original resource UUID as the module_item id so we can use
-- ON CONFLICT (id) DO NOTHING for idempotent re-runs.
INSERT INTO roadmap_module_items (
    id,
    module_id,
    item_type,
    title,
    description,
    display_order,
    is_required,
    is_active,
    resource_url,
    resource_type,
    created_at,
    updated_at
)
SELECT
    r.id,
    r.module_id,
    'material',
    r.title,
    r.description,
    r.display_order,
    true,               -- is_required: default to required
    r.is_active,
    r.content_url,      -- roadmap_resources uses content_url
    r.resource_type,
    r.created_at,
    now()               -- set updated_at to migration time
FROM roadmap_resources r
ON CONFLICT (id) DO NOTHING;

COMMIT;
