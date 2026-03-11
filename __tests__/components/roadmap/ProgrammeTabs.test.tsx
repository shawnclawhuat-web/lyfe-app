import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProgrammeTabs from '@/components/roadmap/ProgrammeTabs';
import type { RoadmapProgramme } from '@/types/roadmap';
import { Colors } from '@/constants/Colors';

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
        Easing: { out: jest.fn(() => jest.fn()), cubic: jest.fn() },
    };
});

const colors = Colors.light;

const makeProgramme = (overrides: Partial<RoadmapProgramme> = {}): RoadmapProgramme => ({
    id: 'prog-1',
    slug: 'seedlyfe',
    title: 'SeedLYFE',
    description: null,
    display_order: 1,
    icon_type: 'seedling',
    is_active: true,
    archived_at: null,
    archived_by: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
});

const TWO_PROGRAMMES: RoadmapProgramme[] = [
    makeProgramme({ id: 'prog-1', title: 'SeedLYFE', slug: 'seedlyfe' }),
    makeProgramme({ id: 'prog-2', title: 'SproutLYFE', slug: 'sproutlyfe', icon_type: 'sprout', display_order: 2 }),
];

describe('ProgrammeTabs', () => {
    const onSelect = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when fewer than 2 programmes', () => {
        const { toJSON } = render(
            <ProgrammeTabs programmes={[TWO_PROGRAMMES[0]]} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        expect(toJSON()).toBeNull();
    });

    it('returns null for empty programmes array', () => {
        const { toJSON } = render(
            <ProgrammeTabs programmes={[]} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        expect(toJSON()).toBeNull();
    });

    it('renders both programme titles when 2 programmes', () => {
        const { getByText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        expect(getByText('SeedLYFE')).toBeTruthy();
        expect(getByText('SproutLYFE')).toBeTruthy();
    });

    it('applies active text color to the selected tab', () => {
        const { getByText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        const activeTab = getByText('SeedLYFE');
        const flatStyle = activeTab.props.style.flat();
        const colorStyles = flatStyle.filter((s: any) => s?.color);
        expect(colorStyles.some((s: any) => s.color === colors.textPrimary)).toBe(true);
    });

    it('applies inactive text color to non-selected tab', () => {
        const { getByText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        const inactiveTab = getByText('SproutLYFE');
        const flatStyle = inactiveTab.props.style.flat();
        const colorStyles = flatStyle.filter((s: any) => s?.color);
        expect(colorStyles.some((s: any) => s.color === colors.textTertiary)).toBe(true);
    });

    it('calls onSelect with the tapped index', () => {
        const { getByText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        fireEvent.press(getByText('SproutLYFE'));
        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('calls onSelect(0) when first tab is tapped', () => {
        const { getByText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={1} onSelect={onSelect} colors={colors} />,
        );
        fireEvent.press(getByText('SeedLYFE'));
        expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('updates active styling when activeIndex changes', () => {
        const { getByText, rerender } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        rerender(<ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={1} onSelect={onSelect} colors={colors} />);
        const sprout = getByText('SproutLYFE');
        const flatStyle = sprout.props.style.flat();
        const colorStyles = flatStyle.filter((s: any) => s?.color);
        expect(colorStyles.some((s: any) => s.color === colors.textPrimary)).toBe(true);
    });

    // ── Accessibility ───────────────────────────────────────────────

    it('each tab has accessibilityRole="tab"', () => {
        const { getByLabelText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        const seedTab = getByLabelText('SeedLYFE');
        const sproutTab = getByLabelText('SproutLYFE');
        expect(seedTab.props.accessibilityRole).toBe('tab');
        expect(sproutTab.props.accessibilityRole).toBe('tab');
    });

    it('active tab has accessibilityState selected=true', () => {
        const { getByLabelText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        const seedTab = getByLabelText('SeedLYFE');
        expect(seedTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    });

    it('inactive tab has accessibilityState selected=false', () => {
        const { getByLabelText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        const sproutTab = getByLabelText('SproutLYFE');
        expect(sproutTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    });

    it('accessibilityState.selected flips when activeIndex changes', () => {
        const { getByLabelText, rerender } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        expect(getByLabelText('SeedLYFE').props.accessibilityState.selected).toBe(true);
        expect(getByLabelText('SproutLYFE').props.accessibilityState.selected).toBe(false);

        rerender(<ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={1} onSelect={onSelect} colors={colors} />);
        expect(getByLabelText('SeedLYFE').props.accessibilityState.selected).toBe(false);
        expect(getByLabelText('SproutLYFE').props.accessibilityState.selected).toBe(true);
    });

    it('each tab has an accessibilityLabel matching the programme title', () => {
        const { getByLabelText } = render(
            <ProgrammeTabs programmes={TWO_PROGRAMMES} activeIndex={0} onSelect={onSelect} colors={colors} />,
        );
        expect(getByLabelText('SeedLYFE')).toBeTruthy();
        expect(getByLabelText('SproutLYFE')).toBeTruthy();
    });
});
