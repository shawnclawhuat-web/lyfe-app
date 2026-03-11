-- Remove duplicate index on candidates.created_by_id
DROP INDEX IF EXISTS idx_candidates_created_by_id;

-- Add composite index for common leads query pattern (filter by agent + status)
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads (assigned_to, status);;
