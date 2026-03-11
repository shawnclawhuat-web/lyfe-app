/**
 * Tests for components/roadmap/ModuleGridCard
 *
 * Business rules verified:
 * - Renders module title and type label
 * - Shows checkmark icon for completed state
 * - Shows lock icon for locked state
 * - Locked cards do not trigger onPress
 * - Available/current cards trigger onPress with module id
 * - Shows item type icons when itemSummary is present
 * - Shows progress bar with correct count text (completed/total)
 * - No progress bar when no items (itemSummary is null)
 * - Reduced opacity for locked state
 * - Left border accent for current/completed states
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import ModuleGridCard from '@/components/roadmap/ModuleGridCard';
import type { RoadmapModuleWithProgress, NodeState, ModuleItemSummary } from '@/types/roadmap';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/constants/platform', () => ({
    displayWeight: (w: string) => w,
    letterSpacing: (v: number) => v,
}));

// ── Fixtures ──

function makeModule(overrides: Partial<RoadmapModuleWithProgress> = {}): RoadmapModuleWithProgress {
    return {
        id: 'mod-1',
        programme_id: 'prog-1',
        title: 'Test Module',
        description: 'Description',
        learning_objectives: null,
        module_type: 'training',
        display_order: 0,
        is_active: true,
        is_required: true,
        estimated_minutes: 30,
        exam_paper_id: null,
        icon_name: 'book-outline',
        icon_color: '#007AFF',
        archived_at: null,
        archived_by: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        progress: null,
        resources: [],
        itemSummary: null,
        isLocked: false,
        examPaper: null,
        prerequisiteIds: [],
        isArchived: false,
        ...overrides,
    };
}

beforeEach(() => jest.clearAllMocks());

describe('ModuleGridCard', () => {
    // ── Basic rendering ──

    it('renders module title', () => {
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'Sales Basics' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('Sales Basics')).toBeTruthy();
    });

    it('renders type label for training module', () => {
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ module_type: 'training' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('Training')).toBeTruthy();
    });

    it('renders type label for exam module', () => {
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ module_type: 'exam' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('Exam')).toBeTruthy();
    });

    it('renders type label for resource module', () => {
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ module_type: 'resource' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('Resource')).toBeTruthy();
    });

    // ── State icons ──

    it('shows checkmark icon for completed state', () => {
        const { toJSON } = render(
            <ModuleGridCard module={makeModule()} state="completed" colors={colors} onPress={jest.fn()} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('checkmark-circle');
    });

    it('shows lock icon for locked state', () => {
        const { toJSON } = render(
            <ModuleGridCard module={makeModule()} state="locked" colors={colors} onPress={jest.fn()} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('lock-closed');
    });

    it('does not show checkmark or lock icon for available state', () => {
        const { toJSON } = render(
            <ModuleGridCard module={makeModule()} state="available" colors={colors} onPress={jest.fn()} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('checkmark-circle');
        expect(json).not.toContain('lock-closed');
    });

    it('does not show checkmark or lock icon for current state', () => {
        const { toJSON } = render(
            <ModuleGridCard module={makeModule()} state="current" colors={colors} onPress={jest.fn()} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('checkmark-circle');
        expect(json).not.toContain('lock-closed');
    });

    // ── Press behavior ──

    it('calls onPress with module id when pressed in available state', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ id: 'mod-42', title: 'Pressable' })}
                state="available"
                colors={colors}
                onPress={onPress}
            />,
        );
        fireEvent.press(getByText('Pressable'));
        expect(onPress).toHaveBeenCalledWith('mod-42');
    });

    it('calls onPress with module id when pressed in current state', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ id: 'mod-99', title: 'Current' })}
                state="current"
                colors={colors}
                onPress={onPress}
            />,
        );
        fireEvent.press(getByText('Current'));
        expect(onPress).toHaveBeenCalledWith('mod-99');
    });

    it('calls onPress with module id when pressed in completed state', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ id: 'mod-done', title: 'Done' })}
                state="completed"
                colors={colors}
                onPress={onPress}
            />,
        );
        fireEvent.press(getByText('Done'));
        expect(onPress).toHaveBeenCalledWith('mod-done');
    });

    it('does NOT call onPress when locked card is pressed', () => {
        const onPress = jest.fn();
        const { getByLabelText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'Locked Module' })}
                state="locked"
                colors={colors}
                onPress={onPress}
            />,
        );
        fireEvent.press(getByLabelText('Locked Module, locked'));
        expect(onPress).not.toHaveBeenCalled();
    });

    // ── Accessibility ──

    it('sets correct accessibility label and hint for available state', () => {
        const { getByLabelText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'My Module' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const el = getByLabelText('My Module, available');
        expect(el.props.accessibilityHint).toBe('Opens module details');
    });

    it('sets correct accessibility hint for locked state', () => {
        const { getByLabelText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'My Module' })}
                state="locked"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const el = getByLabelText('My Module, locked');
        expect(el.props.accessibilityHint).toBe('Module is locked');
    });

    // ── Item summary and progress bar ──

    it('shows progress bar with count text when itemSummary is present', () => {
        const summary: ModuleItemSummary = {
            total: 5,
            completed: 2,
            itemTypes: ['material', 'quiz'],
        };
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: summary })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('2/5')).toBeTruthy();
    });

    it('shows 0/3 count for no completed items', () => {
        const summary: ModuleItemSummary = {
            total: 3,
            completed: 0,
            itemTypes: ['material'],
        };
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: summary })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('0/3')).toBeTruthy();
    });

    it('shows 5/5 count for fully completed items', () => {
        const summary: ModuleItemSummary = {
            total: 5,
            completed: 5,
            itemTypes: ['material', 'quiz', 'exam'],
        };
        const { getByText } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: summary })}
                state="completed"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(getByText('5/5')).toBeTruthy();
    });

    it('does NOT show progress bar when itemSummary is null', () => {
        const { queryByText } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: null })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        // No "X/Y" text should be present
        expect(queryByText(/\d+\/\d+/)).toBeNull();
    });

    it('does NOT show progress bar when itemSummary total is 0', () => {
        const summary: ModuleItemSummary = {
            total: 0,
            completed: 0,
            itemTypes: [],
        };
        const { queryByText } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: summary })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        expect(queryByText(/\d+\/\d+/)).toBeNull();
    });

    // ── Item type icons ──

    it('renders item type icons from itemSummary.itemTypes', () => {
        const summary: ModuleItemSummary = {
            total: 3,
            completed: 1,
            itemTypes: ['material', 'quiz', 'attendance'],
        };
        const { toJSON } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: summary })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const json = JSON.stringify(toJSON());
        // Icons from MODULE_ITEM_TYPE_CONFIG
        expect(json).toContain('document-text-outline'); // material
        expect(json).toContain('create-outline'); // quiz
        expect(json).toContain('people-outline'); // attendance
    });

    it('does not render item type icons when itemSummary is null', () => {
        const { toJSON } = render(
            <ModuleGridCard
                module={makeModule({ itemSummary: null })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const json = JSON.stringify(toJSON());
        // Should not contain any of the item-type-specific icons
        expect(json).not.toContain('document-text-outline');
        expect(json).not.toContain('create-outline');
        expect(json).not.toContain('people-outline');
    });

    // ── Visual state styling ──

    it('applies reduced opacity for locked state', () => {
        const { getByLabelText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'Dim Module' })}
                state="locked"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const pressable = getByLabelText('Dim Module, locked');
        const flatStyle = Array.isArray(pressable.props.style)
            ? Object.assign({}, ...pressable.props.style)
            : pressable.props.style;
        expect(flatStyle.opacity).toBe(0.45);
    });

    it('applies full opacity for available state', () => {
        const { getByLabelText } = render(
            <ModuleGridCard
                module={makeModule({ title: 'Bright Module' })}
                state="available"
                colors={colors}
                onPress={jest.fn()}
            />,
        );
        const pressable = getByLabelText('Bright Module, available');
        const flatStyle = Array.isArray(pressable.props.style)
            ? Object.assign({}, ...pressable.props.style)
            : pressable.props.style;
        expect(flatStyle.opacity).toBe(1);
    });
});
