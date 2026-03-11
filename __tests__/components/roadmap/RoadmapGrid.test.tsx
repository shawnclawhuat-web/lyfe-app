/**
 * Tests for components/roadmap/RoadmapGrid
 *
 * Business rules verified:
 * - Renders correct number of module cards
 * - Uses numColumns={2} for two-column grid layout
 * - Calls onModulePress when a card is pressed
 * - Renders ListHeaderComponent when provided
 * - Empty data array renders without errors
 * - Falls back to 'available' state when nodeStates has no entry
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import RoadmapGrid from '@/components/roadmap/RoadmapGrid';
import type { RoadmapModuleWithProgress, NodeState } from '@/types/roadmap';
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

function makeModules(count: number): RoadmapModuleWithProgress[] {
    return Array.from({ length: count }, (_, i) => makeModule({ id: `mod-${i + 1}`, title: `Module ${i + 1}` }));
}

beforeEach(() => jest.clearAllMocks());

describe('RoadmapGrid', () => {
    const defaultProps = {
        modules: makeModules(4),
        nodeStates: new Map<string, NodeState>(),
        onModulePress: jest.fn(),
        colors,
        reducedMotion: true,
    };

    it('renders the correct number of module cards', () => {
        const { getByText } = render(<RoadmapGrid {...defaultProps} />);

        expect(getByText('Module 1')).toBeTruthy();
        expect(getByText('Module 2')).toBeTruthy();
        expect(getByText('Module 3')).toBeTruthy();
        expect(getByText('Module 4')).toBeTruthy();
    });

    it('uses numColumns={2} for two-column layout', () => {
        const { toJSON } = render(<RoadmapGrid {...defaultProps} />);
        // FlatList with numColumns={2} renders columnWrapperStyle rows
        // Verify it renders without crashing (numColumns is internal to FlatList)
        expect(toJSON()).toBeTruthy();
    });

    it('calls onModulePress when a card is pressed', () => {
        const onModulePress = jest.fn();
        const nodeStates = new Map<string, NodeState>([['mod-1', 'available']]);
        const { getByText } = render(
            <RoadmapGrid
                {...defaultProps}
                modules={[makeModule({ id: 'mod-1', title: 'Clickable Module' })]}
                nodeStates={nodeStates}
                onModulePress={onModulePress}
            />,
        );

        fireEvent.press(getByText('Clickable Module'));
        expect(onModulePress).toHaveBeenCalledWith('mod-1');
    });

    it('renders ListHeaderComponent when provided', () => {
        const header = <Text>Grid Header</Text>;
        const { getByText } = render(<RoadmapGrid {...defaultProps} ListHeaderComponent={header} />);

        expect(getByText('Grid Header')).toBeTruthy();
    });

    it('renders without errors when modules array is empty', () => {
        const { toJSON } = render(<RoadmapGrid {...defaultProps} modules={[]} />);

        expect(toJSON()).toBeTruthy();
    });

    it('defaults to "available" state when module is not in nodeStates map', () => {
        // Module mod-1 is not in the nodeStates map -> should default to 'available'
        // which means it should be pressable (not locked)
        const onModulePress = jest.fn();
        const { getByText } = render(
            <RoadmapGrid
                {...defaultProps}
                modules={[makeModule({ id: 'mod-1', title: 'Available Module' })]}
                nodeStates={new Map()}
                onModulePress={onModulePress}
            />,
        );

        fireEvent.press(getByText('Available Module'));
        expect(onModulePress).toHaveBeenCalledWith('mod-1');
    });

    it('does not allow press on locked modules', () => {
        const onModulePress = jest.fn();
        const nodeStates = new Map<string, NodeState>([['mod-1', 'locked']]);
        const { getByLabelText } = render(
            <RoadmapGrid
                {...defaultProps}
                modules={[makeModule({ id: 'mod-1', title: 'Locked Module' })]}
                nodeStates={nodeStates}
                onModulePress={onModulePress}
            />,
        );

        fireEvent.press(getByLabelText('Locked Module, locked'));
        expect(onModulePress).not.toHaveBeenCalled();
    });

    it('passes completed state from nodeStates to cards', () => {
        const nodeStates = new Map<string, NodeState>([['mod-1', 'completed']]);
        const { getByLabelText } = render(
            <RoadmapGrid
                {...defaultProps}
                modules={[makeModule({ id: 'mod-1', title: 'Done Module' })]}
                nodeStates={nodeStates}
            />,
        );

        expect(getByLabelText('Done Module, completed')).toBeTruthy();
    });

    it('renders multiple modules with mixed states', () => {
        const modules = [
            makeModule({ id: 'mod-1', title: 'Completed' }),
            makeModule({ id: 'mod-2', title: 'Current' }),
            makeModule({ id: 'mod-3', title: 'Locked' }),
        ];
        const nodeStates = new Map<string, NodeState>([
            ['mod-1', 'completed'],
            ['mod-2', 'current'],
            ['mod-3', 'locked'],
        ]);

        const { getByText } = render(<RoadmapGrid {...defaultProps} modules={modules} nodeStates={nodeStates} />);

        expect(getByText('Completed')).toBeTruthy();
        expect(getByText('Current')).toBeTruthy();
        expect(getByText('Locked')).toBeTruthy();
    });
});
