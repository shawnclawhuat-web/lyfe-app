
CREATE TABLE candidate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all" ON candidate_documents FOR SELECT USING (true);
CREATE POLICY "insert_auth" ON candidate_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "delete_auth" ON candidate_documents FOR DELETE USING (auth.role() = 'authenticated');
;
