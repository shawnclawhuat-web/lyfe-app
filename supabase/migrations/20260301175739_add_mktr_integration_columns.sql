-- Add unique constraint on leads.external_id for idempotency (column already exists)
ALTER TABLE public.leads ADD CONSTRAINT leads_external_id_unique UNIQUE (external_id);

-- Add external_id column to users for storing MKTR agent UUID
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS external_id text;;
