-- Add CHECK constraints for string literal columns in roadmap tables
-- Ensures data integrity at the DB level for enum-like columns

ALTER TABLE roadmap_modules
    ADD CONSTRAINT chk_module_type
    CHECK (module_type IN ('training', 'exam', 'resource'));

ALTER TABLE roadmap_programmes
    ADD CONSTRAINT chk_icon_type
    CHECK (icon_type IN ('seedling', 'sprout'));

ALTER TABLE candidate_module_progress
    ADD CONSTRAINT chk_status
    CHECK (status IN ('not_started', 'in_progress', 'completed'));

ALTER TABLE roadmap_resources
    ADD CONSTRAINT chk_resource_type
    CHECK (resource_type IN ('link', 'file', 'video', 'text'));

ALTER TABLE candidate_programme_enrollment
    ADD CONSTRAINT chk_enrollment_status
    CHECK (status IN ('active', 'completed', 'paused'));
