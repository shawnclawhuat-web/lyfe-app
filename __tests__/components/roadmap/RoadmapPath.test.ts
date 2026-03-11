/**
 * Tests for computeCompletedDash (exported from components/roadmap/RoadmapPath)
 *
 * Pure function test — no React rendering required.
 *
 * Business rules verified:
 * - Returns '0 9999' when no modules are completed
 * - Returns correct dash for 1 completed module
 * - Returns correct dash for 3 completed modules followed by non-completed
 * - Returns correct dash when all modules are completed
 * - Stops counting at the first non-completed module (even if later ones are completed)
 */
// Mock react-native-svg (imported by RoadmapPath module — not installed as a dependency)
import { computeCompletedDash } from '@/components/roadmap/RoadmapPath';
import type { RoadmapModuleWithProgress, NodeState } from '@/types/roadmap';

jest.mock(
    'react-native-svg',
    () => ({
        __esModule: true,
        default: 'Svg',
        Path: 'SvgPath',
    }),
    { virtual: true },
);

// ── Minimal module fixture ──
function makeMinimalModule(id: string): RoadmapModuleWithProgress {
    return {
        id,
        programme_id: 'prog-1',
        title: `Module ${id}`,
        description: null,
        learning_objectives: null,
        module_type: 'training',
        display_order: 1,
        is_active: true,
        is_required: true,
        estimated_minutes: null,
        exam_paper_id: null,
        icon_name: null,
        icon_color: null,
        archived_at: null,
        archived_by: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        progress: null,
        resources: [],
        isLocked: false,
        examPaper: null,
        prerequisiteIds: [],
        isArchived: false,
    };
}

const SPACING = 140;

describe('computeCompletedDash', () => {
    it('returns "0 9999" when no modules are completed', () => {
        const modules = [makeMinimalModule('m1'), makeMinimalModule('m2'), makeMinimalModule('m3')];
        const nodeStates = new Map<string, NodeState>([
            ['m1', 'current'],
            ['m2', 'available'],
            ['m3', 'locked'],
        ]);

        expect(computeCompletedDash(modules, nodeStates, SPACING)).toBe('0 9999');
    });

    it('returns correct dash for 1 completed module', () => {
        const modules = [makeMinimalModule('m1'), makeMinimalModule('m2')];
        const nodeStates = new Map<string, NodeState>([
            ['m1', 'completed'],
            ['m2', 'current'],
        ]);

        const expectedLength = 1 * SPACING * 1.2; // 168
        expect(computeCompletedDash(modules, nodeStates, SPACING)).toBe(`${expectedLength} 9999`);
    });

    it('returns correct dash for 3 completed modules followed by non-completed', () => {
        const modules = [
            makeMinimalModule('m1'),
            makeMinimalModule('m2'),
            makeMinimalModule('m3'),
            makeMinimalModule('m4'),
        ];
        const nodeStates = new Map<string, NodeState>([
            ['m1', 'completed'],
            ['m2', 'completed'],
            ['m3', 'completed'],
            ['m4', 'available'],
        ]);

        const expectedLength = 3 * SPACING * 1.2; // 504
        expect(computeCompletedDash(modules, nodeStates, SPACING)).toBe(`${expectedLength} 9999`);
    });

    it('returns correct dash when all modules are completed', () => {
        const modules = [makeMinimalModule('m1'), makeMinimalModule('m2'), makeMinimalModule('m3')];
        const nodeStates = new Map<string, NodeState>([
            ['m1', 'completed'],
            ['m2', 'completed'],
            ['m3', 'completed'],
        ]);

        const expectedLength = 3 * SPACING * 1.2; // 504
        expect(computeCompletedDash(modules, nodeStates, SPACING)).toBe(`${expectedLength} 9999`);
    });

    it('stops counting at first non-completed module (even if later ones are completed)', () => {
        const modules = [
            makeMinimalModule('m1'),
            makeMinimalModule('m2'),
            makeMinimalModule('m3'),
            makeMinimalModule('m4'),
        ];
        const nodeStates = new Map<string, NodeState>([
            ['m1', 'completed'],
            ['m2', 'available'], // breaks the chain
            ['m3', 'completed'], // should NOT count
            ['m4', 'completed'], // should NOT count
        ]);

        // Only 1 completed before the break
        const expectedLength = 1 * SPACING * 1.2; // 168
        expect(computeCompletedDash(modules, nodeStates, SPACING)).toBe(`${expectedLength} 9999`);
    });
});
