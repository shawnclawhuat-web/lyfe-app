
-- Exam papers (M5, M9, M9A, HI)
CREATE TABLE public.exam_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,       -- 'M5', 'M9', 'M9A', 'HI'
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  pass_percentage INT NOT NULL DEFAULT 70,
  question_count INT NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam questions (MCQ with optional LaTeX)
CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  has_latex BOOLEAN DEFAULT false,
  options JSONB NOT NULL,          -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_answer TEXT NOT NULL,    -- 'A', 'B', 'C', or 'D'
  explanation TEXT,
  explanation_has_latex BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(paper_id, question_number)
);

-- Exam attempts (one per candidate per sitting)
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  paper_id UUID NOT NULL REFERENCES public.exam_papers(id),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'timed_out')),
  score INT,                       -- number of correct answers
  total_questions INT NOT NULL,
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  duration_seconds INT,            -- actual time taken
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual answers per question per attempt (idempotent upsert target)
CREATE TABLE public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id),
  selected_answer TEXT,            -- 'A', 'B', 'C', 'D', or NULL if unanswered
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone authenticated can read papers and questions
CREATE POLICY "exam_papers_select" ON public.exam_papers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "exam_questions_select" ON public.exam_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS: Users can read their own attempts
CREATE POLICY "exam_attempts_select_own" ON public.exam_attempts
  FOR SELECT USING (user_id = auth.uid());

-- RLS: Users can insert their own attempts
CREATE POLICY "exam_attempts_insert_own" ON public.exam_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS: Users can update their own in-progress attempts
CREATE POLICY "exam_attempts_update_own" ON public.exam_attempts
  FOR UPDATE USING (user_id = auth.uid() AND status = 'in_progress');

-- RLS: Users can read their own answers
CREATE POLICY "exam_answers_select_own" ON public.exam_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = exam_answers.attempt_id AND user_id = auth.uid())
  );

-- RLS: Users can insert/update their own answers (idempotent upsert)
CREATE POLICY "exam_answers_insert_own" ON public.exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = exam_answers.attempt_id AND user_id = auth.uid() AND status = 'in_progress')
  );

CREATE POLICY "exam_answers_update_own" ON public.exam_answers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = exam_answers.attempt_id AND user_id = auth.uid() AND status = 'in_progress')
  );

-- Admin can manage papers and questions
CREATE POLICY "exam_papers_admin" ON public.exam_papers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exam_questions_admin" ON public.exam_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Manager/Director can view all attempts for their team
CREATE POLICY "exam_attempts_select_team" ON public.exam_attempts
  FOR SELECT USING (
    user_id IN (SELECT get_team_member_ids(auth.uid()))
  );

-- Indexes
CREATE INDEX idx_exam_questions_paper ON public.exam_questions(paper_id, question_number);
CREATE INDEX idx_exam_attempts_user ON public.exam_attempts(user_id, paper_id);
CREATE INDEX idx_exam_answers_attempt ON public.exam_answers(attempt_id);

-- Updated_at trigger for exam_papers
CREATE TRIGGER exam_papers_updated_at
  BEFORE UPDATE ON public.exam_papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
;
