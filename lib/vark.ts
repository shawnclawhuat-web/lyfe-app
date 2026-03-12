/**
 * VARK scoring logic — pure functions, no side effects.
 */
import type { ExamQuestion } from '@/types/exam';
import type { VarkType, VarkPreference, VarkResults } from '@/constants/vark';
import { VARK_STEP_DISTANCE } from '@/constants/vark';

const VARK_TYPES: VarkType[] = ['V', 'A', 'R', 'K'];

/**
 * Parse the VARK type mapping from a question's `explanation` JSON field.
 * Expected format: `{"quiz_type":"vark","types":{"A":"V","B":"A","C":"R","D":"K"}}`
 * Returns null if it's not a VARK question.
 */
export function parseVarkTypeMapping(explanation: string | null): Record<string, VarkType> | null {
    if (!explanation) return null;
    try {
        const parsed = JSON.parse(explanation);
        if (parsed?.quiz_type === 'vark' && parsed?.types) {
            return parsed.types as Record<string, VarkType>;
        }
    } catch {
        // Not JSON or malformed
    }
    return null;
}

/**
 * Compute VARK scores from questions and answers.
 *
 * @param questions - All exam questions (with `explanation` containing type mappings)
 * @param answers - Map of questionId → comma-separated selected options (e.g. "A,C")
 */
export function computeVarkScores(questions: ExamQuestion[], answers: Record<string, string>): VarkResults {
    const scores: Record<VarkType, number> = { V: 0, A: 0, R: 0, K: 0 };

    for (const q of questions) {
        const typeMap = parseVarkTypeMapping(q.explanation);
        if (!typeMap) continue;

        const selectedStr = answers[q.id];
        if (!selectedStr) continue;

        const selections = selectedStr.split(',').filter(Boolean);
        for (const sel of selections) {
            const varkType = typeMap[sel.trim()];
            if (varkType && varkType in scores) {
                scores[varkType]++;
            }
        }
    }

    // Compute percentages
    const totalSelections = VARK_TYPES.reduce((sum, t) => sum + scores[t], 0);
    const percentages: Record<VarkType, number> = { V: 0, A: 0, R: 0, K: 0 };
    if (totalSelections > 0) {
        for (const t of VARK_TYPES) {
            percentages[t] = Math.round((scores[t] / totalSelections) * 100);
        }
    }

    // Classify preference
    const { preference, topTypes } = classifyPreference(scores);

    return { scores, percentages, preference, topTypes };
}

/**
 * Classify learning preference based on VARK scores using stepping-distance rule.
 */
function classifyPreference(scores: Record<VarkType, number>): {
    preference: VarkPreference;
    topTypes: VarkType[];
} {
    // Sort types by score descending
    const sorted = VARK_TYPES.slice().sort((a, b) => scores[b] - scores[a]);

    // Build the top group by checking step distance
    const topTypes: VarkType[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const gap = scores[sorted[i - 1]] - scores[sorted[i]];
        if (gap >= VARK_STEP_DISTANCE) break;
        topTypes.push(sorted[i]);
    }

    const preference: VarkPreference =
        topTypes.length === 1
            ? 'single'
            : topTypes.length === 2
              ? 'bimodal'
              : topTypes.length === 3
                ? 'trimodal'
                : 'multimodal';

    return { preference, topTypes };
}

/**
 * Runtime type guard for VarkResults from JSONB.
 * Use when reading `personality_results` from the database.
 */
export function isVarkResults(val: unknown): val is VarkResults {
    if (!val || typeof val !== 'object') return false;
    const v = val as Record<string, unknown>;
    return (
        v.scores != null &&
        typeof v.scores === 'object' &&
        v.percentages != null &&
        typeof v.percentages === 'object' &&
        Array.isArray(v.topTypes) &&
        typeof v.preference === 'string'
    );
}

/**
 * Get a human-readable label for the preference.
 * e.g. "Visual-Kinesthetic Learner" or "Multimodal Learner"
 */
export function getPreferenceLabel(topTypes: VarkType[], typeLabels: Record<VarkType, string>): string {
    if (topTypes.length >= 4) return 'Multimodal Learner';
    return topTypes.map((t) => typeLabels[t]).join('-') + ' Learner';
}
