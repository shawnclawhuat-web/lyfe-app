/**
 * Tests for config objects exported from types/roadmap.ts
 *
 * Verified:
 * - MODULE_TYPE_CONFIG entries have label and icon but NO color field
 * - MODULE_TYPE_COLOR_KEY maps each ModuleType to the correct ThemeColors key
 * - NODE_STATE_CONFIG opacity and scale values are within valid ranges
 * - RESOURCE_TYPE_CONFIG entries have label and icon
 */
import { MODULE_TYPE_CONFIG, MODULE_TYPE_COLOR_KEY, NODE_STATE_CONFIG, RESOURCE_TYPE_CONFIG } from '@/types/roadmap';
import type { ModuleType, NodeState, ResourceType } from '@/types/roadmap';

// ── MODULE_TYPE_CONFIG ────────────────────────────────────────────────────────

describe('MODULE_TYPE_CONFIG', () => {
    const moduleTypes: ModuleType[] = ['training', 'exam', 'resource'];

    it('is defined for all three module types', () => {
        for (const type of moduleTypes) {
            expect(MODULE_TYPE_CONFIG[type]).toBeDefined();
        }
    });

    it('each entry has a non-empty label', () => {
        for (const type of moduleTypes) {
            expect(typeof MODULE_TYPE_CONFIG[type].label).toBe('string');
            expect(MODULE_TYPE_CONFIG[type].label.length).toBeGreaterThan(0);
        }
    });

    it('each entry has a non-empty icon string', () => {
        for (const type of moduleTypes) {
            expect(typeof MODULE_TYPE_CONFIG[type].icon).toBe('string');
            expect(MODULE_TYPE_CONFIG[type].icon.length).toBeGreaterThan(0);
        }
    });

    it('does NOT have a color field on any entry', () => {
        for (const type of moduleTypes) {
            expect(MODULE_TYPE_CONFIG[type]).not.toHaveProperty('color');
        }
    });

    it('training entry has correct label and icon', () => {
        expect(MODULE_TYPE_CONFIG.training.label).toBe('Training');
        expect(MODULE_TYPE_CONFIG.training.icon).toBe('book-outline');
    });

    it('exam entry has correct label and icon', () => {
        expect(MODULE_TYPE_CONFIG.exam.label).toBe('Exam');
        expect(MODULE_TYPE_CONFIG.exam.icon).toBe('school-outline');
    });

    it('resource entry has correct label and icon', () => {
        expect(MODULE_TYPE_CONFIG.resource.label).toBe('Resource');
        expect(MODULE_TYPE_CONFIG.resource.icon).toBe('folder-outline');
    });

    it('has exactly 3 entries', () => {
        expect(Object.keys(MODULE_TYPE_CONFIG)).toHaveLength(3);
    });
});

// ── MODULE_TYPE_COLOR_KEY ─────────────────────────────────────────────────────

describe('MODULE_TYPE_COLOR_KEY', () => {
    it('is exported from types/roadmap', () => {
        expect(MODULE_TYPE_COLOR_KEY).toBeDefined();
    });

    it('has a key for each module type', () => {
        expect(MODULE_TYPE_COLOR_KEY).toHaveProperty('training');
        expect(MODULE_TYPE_COLOR_KEY).toHaveProperty('exam');
        expect(MODULE_TYPE_COLOR_KEY).toHaveProperty('resource');
    });

    it('training maps to roadmapTraining', () => {
        expect(MODULE_TYPE_COLOR_KEY.training).toBe('roadmapTraining');
    });

    it('exam maps to roadmapExam', () => {
        expect(MODULE_TYPE_COLOR_KEY.exam).toBe('roadmapExam');
    });

    it('resource maps to roadmapResource', () => {
        expect(MODULE_TYPE_COLOR_KEY.resource).toBe('roadmapResource');
    });

    it('all three color keys are distinct', () => {
        const keys = Object.values(MODULE_TYPE_COLOR_KEY);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
    });

    it('has exactly 3 entries', () => {
        expect(Object.keys(MODULE_TYPE_COLOR_KEY)).toHaveLength(3);
    });

    it('all color key values are strings starting with "roadmap"', () => {
        for (const [type, colorKey] of Object.entries(MODULE_TYPE_COLOR_KEY)) {
            expect(typeof colorKey).toBe('string', `MODULE_TYPE_COLOR_KEY.${type} should be a string`);
            expect(colorKey.startsWith('roadmap')).toBe(
                true,
                `MODULE_TYPE_COLOR_KEY.${type} = "${colorKey}" does not start with "roadmap"`,
            );
        }
    });

    it('color keys resolve to actual Colors.light properties', () => {
        // Import Colors here to verify the color keys actually exist in the theme
        const { Colors } = require('@/constants/Colors');
        for (const colorKey of Object.values(MODULE_TYPE_COLOR_KEY)) {
            expect(Colors.light).toHaveProperty(colorKey);
            expect(typeof Colors.light[colorKey]).toBe('string');
        }
    });
});

// ── NODE_STATE_CONFIG ─────────────────────────────────────────────────────────

describe('NODE_STATE_CONFIG', () => {
    const nodeStates: NodeState[] = ['completed', 'current', 'available', 'locked'];

    it('is defined for all four node states', () => {
        for (const state of nodeStates) {
            expect(NODE_STATE_CONFIG[state]).toBeDefined();
        }
    });

    it('each entry has opacity and scale fields', () => {
        for (const state of nodeStates) {
            expect(NODE_STATE_CONFIG[state]).toHaveProperty('opacity');
            expect(NODE_STATE_CONFIG[state]).toHaveProperty('scale');
        }
    });

    it('all opacity values are in the range [0, 1]', () => {
        for (const state of nodeStates) {
            const { opacity } = NODE_STATE_CONFIG[state];
            expect(opacity).toBeGreaterThanOrEqual(0);
            expect(opacity).toBeLessThanOrEqual(1);
        }
    });

    it('all scale values are positive and at most 1.5', () => {
        for (const state of nodeStates) {
            const { scale } = NODE_STATE_CONFIG[state];
            expect(scale).toBeGreaterThan(0);
            expect(scale).toBeLessThanOrEqual(1.5);
        }
    });

    it('completed state has full opacity and scale 1', () => {
        expect(NODE_STATE_CONFIG.completed.opacity).toBe(1);
        expect(NODE_STATE_CONFIG.completed.scale).toBe(1);
    });

    it('current state has full opacity and slightly enlarged scale', () => {
        expect(NODE_STATE_CONFIG.current.opacity).toBe(1);
        expect(NODE_STATE_CONFIG.current.scale).toBeGreaterThan(1);
    });

    it('available state has high opacity', () => {
        expect(NODE_STATE_CONFIG.available.opacity).toBeGreaterThanOrEqual(0.8);
        expect(NODE_STATE_CONFIG.available.scale).toBe(1);
    });

    it('locked state has reduced opacity (dimmed)', () => {
        expect(NODE_STATE_CONFIG.locked.opacity).toBeLessThan(0.6);
    });

    it('locked state has reduced scale (smaller)', () => {
        expect(NODE_STATE_CONFIG.locked.scale).toBeLessThan(1);
    });

    it('locked state is less prominent than available state', () => {
        expect(NODE_STATE_CONFIG.locked.opacity).toBeLessThan(NODE_STATE_CONFIG.available.opacity);
        expect(NODE_STATE_CONFIG.locked.scale).toBeLessThan(NODE_STATE_CONFIG.available.scale);
    });

    it('has exactly 4 entries', () => {
        expect(Object.keys(NODE_STATE_CONFIG)).toHaveLength(4);
    });
});

// ── RESOURCE_TYPE_CONFIG ──────────────────────────────────────────────────────

describe('RESOURCE_TYPE_CONFIG', () => {
    const resourceTypes: ResourceType[] = ['link', 'file', 'video', 'text'];

    it('is defined for all four resource types', () => {
        for (const type of resourceTypes) {
            expect(RESOURCE_TYPE_CONFIG[type]).toBeDefined();
        }
    });

    it('each entry has a non-empty label', () => {
        for (const type of resourceTypes) {
            expect(typeof RESOURCE_TYPE_CONFIG[type].label).toBe('string');
            expect(RESOURCE_TYPE_CONFIG[type].label.length).toBeGreaterThan(0);
        }
    });

    it('each entry has a non-empty icon string', () => {
        for (const type of resourceTypes) {
            expect(typeof RESOURCE_TYPE_CONFIG[type].icon).toBe('string');
            expect(RESOURCE_TYPE_CONFIG[type].icon.length).toBeGreaterThan(0);
        }
    });

    it('does NOT have a color field on any entry', () => {
        for (const type of resourceTypes) {
            expect(RESOURCE_TYPE_CONFIG[type]).not.toHaveProperty('color');
        }
    });
});
