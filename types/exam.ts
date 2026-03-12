/**
 * Exam-related TypeScript types
 */

export interface ExamPaper {
    id: string;
    code: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    pass_percentage: number;
    question_count: number;
    is_active: boolean;
    is_mandatory: boolean;
    display_order: number;
    /** When true, quiz allows multi-select (personality/assessment quiz — no pass/fail) */
    allow_multiple_answers: boolean;
}

export interface ExamQuestion {
    id: string;
    paper_id: string;
    question_number: number;
    question_text: string;
    has_latex: boolean;
    options: Record<string, string>; // { A: "...", B: "...", C: "...", D: "..." }
    correct_answer: string;
    explanation: string | null;
    explanation_has_latex: boolean;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'timed_out';

export interface ExamAttempt {
    id: string;
    user_id: string;
    paper_id: string;
    status: AttemptStatus;
    score: number | null;
    total_questions: number;
    percentage: number | null;
    passed: boolean | null;
    started_at: string;
    submitted_at: string | null;
    duration_seconds: number | null;
}

export interface ExamAnswer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_answer: string | null;
    is_correct: boolean | null;
    answered_at: string;
}

/** Local exam state for active session (persisted to AsyncStorage) */
export interface ActiveExamState {
    schemaVersion: number;
    attemptId: string;
    paperId: string;
    paperCode: string;
    answers: Record<string, string>; // { [questionId]: selectedAnswer (comma-separated for multi-select) }
    currentIndex: number;
    startedAt: number; // Unix timestamp
    durationMinutes: number;
    totalQuestions: number;
    allowMultipleAnswers: boolean;
}

/** Current schema version for ActiveExamState. Bump when shape changes. */
export const ACTIVE_EXAM_SCHEMA_VERSION = 2;

/** Stats shown on the exam card */
export interface PaperStats {
    attemptCount: number;
    bestScore: number | null;
    lastAttemptDate: string | null;
    bestPassed: boolean | null;
}
