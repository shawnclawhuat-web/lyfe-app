import { parseVarkTypeMapping, computeVarkScores, getPreferenceLabel, isVarkResults } from '@/lib/vark';
import type { ExamQuestion } from '@/types/exam';
import type { VarkType } from '@/constants/vark';

const TYPE_LABELS: Record<VarkType, string> = {
    V: 'Visual',
    A: 'Aural',
    R: 'Read/Write',
    K: 'Kinesthetic',
};

function makeQuestion(id: string, num: number): ExamQuestion {
    return {
        id,
        paper_id: 'vark-paper',
        question_number: num,
        question_text: `Question ${num}`,
        has_latex: false,
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
        correct_answer: 'A:V,B:A,C:R,D:K',
        explanation: '{"quiz_type":"vark","types":{"A":"V","B":"A","C":"R","D":"K"}}',
        explanation_has_latex: false,
    };
}

function makeQuestions(count: number): ExamQuestion[] {
    return Array.from({ length: count }, (_, i) => makeQuestion(`q${i + 1}`, i + 1));
}

// ── parseVarkTypeMapping ──

describe('parseVarkTypeMapping', () => {
    it('parses valid VARK explanation JSON', () => {
        const result = parseVarkTypeMapping('{"quiz_type":"vark","types":{"A":"V","B":"A","C":"R","D":"K"}}');
        expect(result).toEqual({ A: 'V', B: 'A', C: 'R', D: 'K' });
    });

    it('returns null for null input', () => {
        expect(parseVarkTypeMapping(null)).toBeNull();
    });

    it('returns null for non-VARK JSON', () => {
        expect(parseVarkTypeMapping('{"quiz_type":"other"}')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
        expect(parseVarkTypeMapping('not json')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(parseVarkTypeMapping('')).toBeNull();
    });
});

// ── computeVarkScores ──

describe('computeVarkScores', () => {
    it('tallies single-select answers correctly', () => {
        const questions = makeQuestions(4);
        // q1=A(V), q2=B(A), q3=C(R), q4=D(K)
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'B',
            q3: 'C',
            q4: 'D',
        };

        const result = computeVarkScores(questions, answers);
        expect(result.scores).toEqual({ V: 1, A: 1, R: 1, K: 1 });
        expect(result.percentages.V).toBe(25);
        expect(result.preference).toBe('multimodal');
        expect(result.topTypes).toHaveLength(4);
    });

    it('tallies multi-select answers (comma-separated)', () => {
        const questions = makeQuestions(2);
        const answers: Record<string, string> = {
            q1: 'A,C', // V + R
            q2: 'A,B', // V + A
        };

        const result = computeVarkScores(questions, answers);
        expect(result.scores).toEqual({ V: 2, A: 1, R: 1, K: 0 });
    });

    it('handles unanswered questions', () => {
        const questions = makeQuestions(4);
        const answers: Record<string, string> = {
            q1: 'A', // V
            q3: 'A', // V
        };

        const result = computeVarkScores(questions, answers);
        expect(result.scores).toEqual({ V: 2, A: 0, R: 0, K: 0 });
        expect(result.preference).toBe('single');
        expect(result.topTypes).toEqual(['V']);
    });

    it('handles empty answers object', () => {
        const questions = makeQuestions(4);
        const result = computeVarkScores(questions, {});
        expect(result.scores).toEqual({ V: 0, A: 0, R: 0, K: 0 });
        expect(result.percentages).toEqual({ V: 0, A: 0, R: 0, K: 0 });
    });

    it('classifies single preference with clear leader', () => {
        const questions = makeQuestions(8);
        // 6 V, 1 A, 1 R — gap of 5 between V and A
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'A',
            q3: 'A',
            q4: 'A',
            q5: 'A',
            q6: 'A', // V x6
            q7: 'B', // A x1
            q8: 'C', // R x1
        };

        const result = computeVarkScores(questions, answers);
        expect(result.preference).toBe('single');
        expect(result.topTypes).toEqual(['V']);
    });

    it('classifies bimodal when two types are close but others are distant', () => {
        const questions = makeQuestions(8);
        // 4 V, 4 A, 0 R, 0 K — V and A equal, gap to R/K is 4 (>= step distance 2)
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'A',
            q3: 'A',
            q4: 'A', // V x4
            q5: 'B',
            q6: 'B',
            q7: 'B',
            q8: 'B', // A x4
        };

        const result = computeVarkScores(questions, answers);
        expect(result.preference).toBe('bimodal');
        expect(result.topTypes).toContain('V');
        expect(result.topTypes).toContain('A');
        expect(result.topTypes).toHaveLength(2);
    });

    it('classifies trimodal when three types are close but fourth is distant', () => {
        const questions = makeQuestions(8);
        // 3 V, 3 A, 2 R, 0 K — gap between R(2) and K(0) is 2 (= step distance), so K excluded
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'A',
            q3: 'A', // V x3
            q4: 'B',
            q5: 'B',
            q6: 'B', // A x3
            q7: 'C',
            q8: 'C', // R x2
        };

        const result = computeVarkScores(questions, answers);
        expect(result.preference).toBe('trimodal');
        expect(result.topTypes).toHaveLength(3);
    });

    it('classifies multimodal when all four types are close', () => {
        const questions = makeQuestions(8);
        // 2 V, 2 A, 2 R, 2 K — all equal
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'A', // V x2
            q3: 'B',
            q4: 'B', // A x2
            q5: 'C',
            q6: 'C', // R x2
            q7: 'D',
            q8: 'D', // K x2
        };

        const result = computeVarkScores(questions, answers);
        expect(result.preference).toBe('multimodal');
        expect(result.topTypes).toHaveLength(4);
    });

    it('skips questions with non-VARK explanation', () => {
        const questions = makeQuestions(2);
        questions[0].explanation = 'Not VARK JSON';
        const answers: Record<string, string> = {
            q1: 'A',
            q2: 'B', // A
        };

        const result = computeVarkScores(questions, answers);
        // Only q2 should count
        expect(result.scores).toEqual({ V: 0, A: 1, R: 0, K: 0 });
    });

    it('handles empty comma-separated string (all deselected)', () => {
        const questions = makeQuestions(2);
        const answers: Record<string, string> = {
            q1: '', // deselected all
            q2: 'A',
        };

        const result = computeVarkScores(questions, answers);
        expect(result.scores).toEqual({ V: 1, A: 0, R: 0, K: 0 });
    });
});

// ── getPreferenceLabel ──

describe('getPreferenceLabel', () => {
    it('returns single type label', () => {
        expect(getPreferenceLabel(['V'], TYPE_LABELS)).toBe('Visual Learner');
    });

    it('returns bimodal label', () => {
        expect(getPreferenceLabel(['V', 'K'], TYPE_LABELS)).toBe('Visual-Kinesthetic Learner');
    });

    it('returns trimodal label', () => {
        expect(getPreferenceLabel(['V', 'A', 'R'], TYPE_LABELS)).toBe('Visual-Aural-Read/Write Learner');
    });

    it('returns Multimodal for all four', () => {
        expect(getPreferenceLabel(['V', 'A', 'R', 'K'], TYPE_LABELS)).toBe('Multimodal Learner');
    });
});

// ── isVarkResults ──

describe('isVarkResults', () => {
    const validResults = {
        scores: { V: 3, A: 2, R: 1, K: 0 },
        percentages: { V: 50, A: 33, R: 17, K: 0 },
        topTypes: ['V'] as const,
        preference: 'single',
    };

    it('returns true for valid VarkResults object', () => {
        expect(isVarkResults(validResults)).toBe(true);
    });

    it('returns false for null', () => {
        expect(isVarkResults(null)).toBe(false);
    });

    it('returns false for a string', () => {
        expect(isVarkResults('not an object')).toBe(false);
    });

    it('returns false for object missing scores', () => {
        const { scores, ...rest } = validResults;
        expect(isVarkResults(rest)).toBe(false);
    });

    it('returns false for object with topTypes as string instead of array', () => {
        expect(isVarkResults({ ...validResults, topTypes: 'V' })).toBe(false);
    });

    it('returns false for object with preference as number instead of string', () => {
        expect(isVarkResults({ ...validResults, preference: 42 })).toBe(false);
    });
});
