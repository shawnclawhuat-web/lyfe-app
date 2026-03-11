import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoadmapNode from '@/components/roadmap/RoadmapNode';
import { Colors } from '@/constants/Colors';
import type { NodeState, ModuleType } from '@/types/roadmap';

jest.mock('react-native-reanimated', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: {
            View: (props: any) => <View {...props} />,
        },
        useSharedValue: jest.fn((v: number) => ({ value: v })),
        useAnimatedStyle: jest.fn(() => ({})),
        withTiming: jest.fn((v: number) => v),
        withRepeat: jest.fn((v: number) => v),
        withSequence: jest.fn((...args: any[]) => args[0]),
        withSpring: jest.fn((v: number) => v),
        Easing: {
            out: jest.fn(() => jest.fn()),
            inOut: jest.fn(() => jest.fn()),
            cubic: jest.fn(),
            sin: jest.fn(),
        },
    };
});

const colors = Colors.light;

describe('RoadmapNode', () => {
    const onPress = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderNode = (
        overrides: {
            state?: NodeState;
            moduleType?: ModuleType;
            title?: string;
            index?: number;
            iconName?: string;
            iconColor?: string;
        } = {},
    ) =>
        render(
            <RoadmapNode
                title={overrides.title ?? 'Intro to Insurance'}
                state={overrides.state ?? 'available'}
                moduleType={overrides.moduleType ?? 'training'}
                index={overrides.index ?? 0}
                onPress={onPress}
                colors={colors}
                iconName={overrides.iconName}
                iconColor={overrides.iconColor}
            />,
        );

    // ── Accessibility ─────────────────────────────────────────────

    it('sets accessibility label with step number, title, and state', () => {
        const { getByLabelText } = renderNode({ title: 'MAS Regulations', index: 0 });
        expect(getByLabelText(/Step 1.*MAS Regulations.*available/)).toBeTruthy();
    });

    it('includes correct step number for higher index', () => {
        const { getByLabelText } = renderNode({ index: 4, title: 'Fifth' });
        expect(getByLabelText(/Step 5/)).toBeTruthy();
    });

    // ── States ────────────────────────────────────────────────────

    it('renders completed state without crashing', () => {
        const tree = renderNode({ state: 'completed' });
        expect(tree.toJSON()).not.toBeNull();
    });

    it('uses success color for completed node', () => {
        const { toJSON } = renderNode({ state: 'completed' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain(colors.success);
    });

    it('uses accent color for current node', () => {
        const { toJSON } = renderNode({ state: 'current' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain(colors.accent);
    });

    it('renders pulse ring for current state', () => {
        const currentTree = renderNode({ state: 'current' }).toJSON();
        const availableTree = renderNode({ state: 'available' }).toJSON();
        const currentStr = JSON.stringify(currentTree);
        const availableStr = JSON.stringify(availableTree);
        expect(currentStr).toContain(colors.accent);
        // Current node tree is larger due to pulse ring element
        expect(currentStr.length).toBeGreaterThan(availableStr.length);
    });

    // ── Interaction ───────────────────────────────────────────────

    it('is pressable when available', () => {
        const { getByLabelText } = renderNode({ state: 'available', title: 'Tap Me' });
        fireEvent.press(getByLabelText(/Tap Me/));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('is pressable in locked state (shows info bubble)', () => {
        const { getByLabelText } = renderNode({ state: 'locked', title: 'Locked Module' });
        fireEvent.press(getByLabelText(/Locked Module/));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress when completed node is tapped', () => {
        const { getByLabelText } = renderNode({ state: 'completed', title: 'Done Module' });
        fireEvent.press(getByLabelText(/Done Module/));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress when current node is tapped', () => {
        const { getByLabelText } = renderNode({ state: 'current', title: 'Current Module' });
        fireEvent.press(getByLabelText(/Current Module/));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    // ── Visuals ───────────────────────────────────────────────────

    it('uses iconColor for available node fill', () => {
        const { toJSON } = renderNode({ state: 'available', iconColor: '#007AFF' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain('#007AFF');
    });

    it('renders shadow base and main circle (3D effect)', () => {
        const { toJSON } = renderNode({ state: 'available' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain('rgba(255, 255, 255,');
    });

    // ── No visible title (bubble handles titles now) ─────────────

    it('does not render visible title text', () => {
        const { queryByText } = renderNode({ title: 'Some Module' });
        expect(queryByText(/Some Module/)).toBeNull();
    });
});
