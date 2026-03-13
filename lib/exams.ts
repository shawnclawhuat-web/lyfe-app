/**
 * Exams service — Supabase CRUD for exam attempts & answers
 */
import type { ExamQuestion } from '@/types/exam';
import type { VarkResults } from '@/constants/vark';
import type { EnneagramResults } from '@/constants/enneagram';
import { computeVarkScores, isVarkResults } from './vark';
import { computeEnneagramScores, isEnneagramResults } from './enneagram';
import { supabase } from './supabase';

/** Default pass threshold when exam_papers.pass_percentage is unavailable */
const DEFAULT_PASS_PERCENTAGE = 70;

// ── Submit Exam ──────────────────────────────────────────────

interface SubmitExamInput {
    userId: string;
    paperId: string;
    questions: ExamQuestion[];
    answers: Record<string, string>; // { [questionId]: selectedAnswer (comma-separated for multi) }
    status: 'submitted' | 'auto_submitted';
    startedAt: number; // Unix ms
}

export interface ExamResultData {
    id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    status: string;
    answers: {
        questionId: string;
        selected: string | null;
        isCorrect: boolean;
        correctAnswer: string;
    }[];
    questions: ExamQuestion[];
    paperCode: string;
    /** Present only for personality quizzes (VARK, Enneagram, etc.) */
    personalityResults?: VarkResults | EnneagramResults | null;
}

/**
 * Submit an exam attempt to Supabase and return the result.
 * Creates both `exam_attempts` and `exam_answers` rows.
 */
export async function submitExamAttempt(
    input: SubmitExamInput,
    paperCode: string,
): Promise<{ data: ExamResultData | null; error: string | null }> {
    const { userId, paperId, questions, answers, status, startedAt } = input;

    // Calculate score
    let correct = 0;
    const answerDetails = questions.map((q) => {
        const selected = answers[q.id] || null;
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) correct++;
        return { questionId: q.id, selected, isCorrect, correctAnswer: q.correct_answer };
    });

    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= DEFAULT_PASS_PERCENTAGE;
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);

    // Insert attempt as 'in_progress' first so RLS allows answer inserts
    const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
            user_id: userId,
            paper_id: paperId,
            status: 'in_progress',
            score: correct,
            total_questions: questions.length,
            percentage,
            passed,
            started_at: new Date(startedAt).toISOString(),
            submitted_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
        })
        .select()
        .single();

    if (attemptError) {
        return { data: null, error: attemptError.message };
    }

    // Insert individual answers (RLS requires attempt status = 'in_progress')
    const answerRows = questions.map((q) => ({
        attempt_id: attempt.id,
        question_id: q.id,
        selected_answer: answers[q.id] || null,
        is_correct: (answers[q.id] || null) === q.correct_answer,
    }));

    const { error: answersError } = await supabase.from('exam_answers').insert(answerRows);

    if (answersError) {
        // Answers failed — clean up the orphaned attempt and surface the error
        await supabase.from('exam_attempts').delete().eq('id', attempt.id);
        return { data: null, error: 'Failed to save your answers. Please try again.' };
    }

    // Now update attempt to final status
    const { error: updateError } = await supabase.from('exam_attempts').update({ status }).eq('id', attempt.id);

    if (updateError) {
        return { data: null, error: 'Exam submitted but status update failed. Please contact support.' };
    }

    return {
        data: {
            id: attempt.id,
            score: correct,
            totalQuestions: questions.length,
            percentage,
            passed,
            status,
            answers: answerDetails,
            questions,
            paperCode,
        },
        error: null,
    };
}

// ── Submit VARK / Personality Quiz ───────────────────────────

/**
 * Submit a VARK (multi-select personality) quiz attempt.
 * No right/wrong scoring — tallies V/A/R/K and stores a personality profile.
 */
export async function submitVarkAttempt(
    input: SubmitExamInput,
    paperCode: string,
): Promise<{ data: ExamResultData | null; error: string | null }> {
    const { userId, paperId, questions, answers, status, startedAt } = input;

    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const varkResults = computeVarkScores(questions, answers);

    // Build answer details (no correct/incorrect for personality quizzes)
    const answerDetails = questions.map((q) => ({
        questionId: q.id,
        selected: answers[q.id] || null,
        isCorrect: false,
        correctAnswer: q.correct_answer,
    }));

    // Insert attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
            user_id: userId,
            paper_id: paperId,
            status: 'in_progress',
            score: null,
            total_questions: questions.length,
            percentage: null,
            passed: null,
            started_at: new Date(startedAt).toISOString(),
            submitted_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            personality_results: varkResults,
        })
        .select()
        .single();

    if (attemptError) {
        return { data: null, error: attemptError.message };
    }

    // Insert answers (comma-separated for multi-select, is_correct = null)
    const answerRows = questions.map((q) => ({
        attempt_id: attempt.id,
        question_id: q.id,
        selected_answer: answers[q.id] || null,
        is_correct: null,
    }));

    const { error: answersError } = await supabase.from('exam_answers').insert(answerRows);

    if (answersError) {
        await supabase.from('exam_attempts').delete().eq('id', attempt.id);
        return { data: null, error: 'Failed to save your answers. Please try again.' };
    }

    // Update attempt to final status
    const { error: updateError } = await supabase.from('exam_attempts').update({ status }).eq('id', attempt.id);

    if (updateError) {
        return { data: null, error: 'Assessment submitted but status update failed.' };
    }

    return {
        data: {
            id: attempt.id,
            score: 0,
            totalQuestions: questions.length,
            percentage: 0,
            passed: false,
            status,
            answers: answerDetails,
            questions,
            paperCode,
            personalityResults: varkResults,
        },
        error: null,
    };
}

// ── Submit Enneagram / Personality Quiz ──────────────────────

/**
 * Submit an Enneagram (forced-choice personality) quiz attempt.
 * No right/wrong scoring — tallies 9 Enneagram types and stores a personality profile.
 */
export async function submitEnneagramAttempt(
    input: SubmitExamInput,
    paperCode: string,
): Promise<{ data: ExamResultData | null; error: string | null }> {
    const { userId, paperId, questions, answers, status, startedAt } = input;

    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const enneagramResults = computeEnneagramScores(questions, answers);

    // Build answer details (no correct/incorrect for personality quizzes)
    const answerDetails = questions.map((q) => ({
        questionId: q.id,
        selected: answers[q.id] || null,
        isCorrect: false,
        correctAnswer: q.correct_answer,
    }));

    // Insert attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
            user_id: userId,
            paper_id: paperId,
            status: 'in_progress',
            score: null,
            total_questions: questions.length,
            percentage: null,
            passed: null,
            started_at: new Date(startedAt).toISOString(),
            submitted_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            personality_results: enneagramResults,
        })
        .select()
        .single();

    if (attemptError) {
        return { data: null, error: attemptError.message };
    }

    // Insert answers (single-select, is_correct = null)
    const answerRows = questions.map((q) => ({
        attempt_id: attempt.id,
        question_id: q.id,
        selected_answer: answers[q.id] || null,
        is_correct: null,
    }));

    const { error: answersError } = await supabase.from('exam_answers').insert(answerRows);

    if (answersError) {
        await supabase.from('exam_attempts').delete().eq('id', attempt.id);
        return { data: null, error: 'Failed to save your answers. Please try again.' };
    }

    // Update attempt to final status
    const { error: updateError } = await supabase.from('exam_attempts').update({ status }).eq('id', attempt.id);

    if (updateError) {
        return { data: null, error: 'Assessment submitted but status update failed.' };
    }

    return {
        data: {
            id: attempt.id,
            score: 0,
            totalQuestions: questions.length,
            percentage: 0,
            passed: false,
            status,
            answers: answerDetails,
            questions,
            paperCode,
            personalityResults: enneagramResults,
        },
        error: null,
    };
}

// ── Fetch Exam Result ────────────────────────────────────────

/**
 * Fetch a completed exam attempt with its answers and questions from Supabase.
 * Falls back to null if not found (caller should try AsyncStorage).
 */
export async function fetchExamResult(
    attemptId: string,
): Promise<{ data: ExamResultData | null; error: string | null }> {
    // Fetch the attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

    if (attemptError) return { data: null, error: attemptError.message };

    // Fetch the paper code
    const { data: paper } = await supabase
        .from('exam_papers')
        .select('code, allow_multiple_answers')
        .eq('id', attempt.paper_id)
        .single();

    // If this is a personality quiz with stored results, return them directly
    if (attempt.personality_results) {
        // Still fetch questions for display
        const { data: questionsData } = await supabase
            .from('exam_questions')
            .select('*')
            .eq('paper_id', attempt.paper_id)
            .order('question_number');

        return {
            data: {
                id: attempt.id,
                score: 0,
                totalQuestions: attempt.total_questions,
                percentage: 0,
                passed: false,
                status: attempt.status,
                answers: [],
                questions: (questionsData as ExamQuestion[]) || [],
                paperCode: paper.code || '',
                personalityResults: isEnneagramResults(attempt.personality_results)
                    ? attempt.personality_results
                    : isVarkResults(attempt.personality_results)
                      ? attempt.personality_results
                      : null,
            },
            error: null,
        };
    }

    // Fetch answers with questions joined
    const { data: examAnswers, error: answersError } = await supabase
        .from('exam_answers')
        .select('*, exam_questions!exam_answers_question_id_fkey(*)')
        .eq('attempt_id', attemptId)
        .order('exam_questions(question_number)');

    if (answersError) return { data: null, error: answersError.message };

    const questions: ExamQuestion[] = [];
    const answerDetails: ExamResultData['answers'] = [];

    (
        (examAnswers || []) as {
            selected_answer: string | null;
            is_correct: boolean;
            exam_questions: ExamQuestion | null;
        }[]
    ).forEach((row) => {
        const q = row.exam_questions;
        if (q) {
            questions.push(q);
            answerDetails.push({
                questionId: q.id,
                selected: row.selected_answer,
                isCorrect: row.is_correct,
                correctAnswer: q.correct_answer,
            });
        }
    });

    return {
        data: {
            id: attempt.id,
            score: attempt.score || 0,
            totalQuestions: attempt.total_questions,
            percentage: attempt.percentage || 0,
            passed: attempt.passed || false,
            status: attempt.status,
            answers: answerDetails,
            questions,
            paperCode: paper?.code || '',
        },
        error: null,
    };
}
