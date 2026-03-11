
CREATE TABLE candidate_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note')),
    outcome TEXT CHECK (outcome IN ('reached', 'no_answer', 'sent')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidate_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all" ON candidate_activities FOR SELECT USING (true);
CREATE POLICY "insert_own" ON candidate_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
;
