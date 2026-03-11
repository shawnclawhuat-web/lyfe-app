import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressSummaryCard from '@/components/roadmap/ProgressSummaryCard';
import type { ProgrammeWithModules } from '@/types/roadmap';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

const makeProgramme = (overrides: Partial<ProgrammeWithModules> = {}): ProgrammeWithModules => ({
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
    modules: [],
    completedCount: 3,
    totalCount: 8,
    percentage: 38,
    isLocked: false,
    manuallyUnlocked: false,
    unlockedByName: null,
    ...overrides,
});

describe('ProgressSummaryCard', () => {
    const onViewFull = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when programmes array is empty', () => {
        const { toJSON } = render(<ProgressSummaryCard programmes={[]} onViewFull={onViewFull} colors={colors} />);
        expect(toJSON()).toBeNull();
    });

    it('renders the header title', () => {
        const { getByText } = render(
            <ProgressSummaryCard programmes={[makeProgramme()]} onViewFull={onViewFull} colors={colors} />,
        );
        expect(getByText('Development Roadmap')).toBeTruthy();
    });

    it('renders a single programme name and progress', () => {
        const { getByText } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ title: 'SeedLYFE', completedCount: 3, totalCount: 8 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        expect(getByText('SeedLYFE')).toBeTruthy();
        expect(getByText('3/8')).toBeTruthy();
    });

    it('renders multiple programmes', () => {
        const programmes = [
            makeProgramme({ id: 'p1', title: 'SeedLYFE', completedCount: 3, totalCount: 8 }),
            makeProgramme({
                id: 'p2',
                title: 'SproutLYFE',
                slug: 'sproutlyfe',
                icon_type: 'sprout',
                completedCount: 1,
                totalCount: 6,
            }),
        ];
        const { getByText } = render(
            <ProgressSummaryCard programmes={programmes} onViewFull={onViewFull} colors={colors} />,
        );
        expect(getByText('SeedLYFE')).toBeTruthy();
        expect(getByText('SproutLYFE')).toBeTruthy();
        expect(getByText('3/8')).toBeTruthy();
        expect(getByText('1/6')).toBeTruthy();
    });

    it('renders the "View Full Progress" button', () => {
        const { getByText } = render(
            <ProgressSummaryCard programmes={[makeProgramme()]} onViewFull={onViewFull} colors={colors} />,
        );
        expect(getByText('View Full Progress')).toBeTruthy();
    });

    it('calls onViewFull when the button is pressed', () => {
        const { getByText } = render(
            <ProgressSummaryCard programmes={[makeProgramme()]} onViewFull={onViewFull} colors={colors} />,
        );
        fireEvent.press(getByText('View Full Progress'));
        expect(onViewFull).toHaveBeenCalledTimes(1);
    });

    it('renders zero progress correctly', () => {
        const { getByText } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 0, totalCount: 5, percentage: 0 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        expect(getByText('0/5')).toBeTruthy();
    });

    it('renders full completion correctly', () => {
        const { getByText } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 10, totalCount: 10, percentage: 100 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        expect(getByText('10/10')).toBeTruthy();
    });

    // ── Accessibility: progressbar role ─────────────────────────────

    it('progress track has accessibilityRole="progressbar"', () => {
        const { toJSON } = render(
            <ProgressSummaryCard programmes={[makeProgramme()]} onViewFull={onViewFull} colors={colors} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"progressbar"');
    });

    it('progress track has correct accessibilityValue min=0', () => {
        const { toJSON } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 3, totalCount: 8 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"min":0');
    });

    it('progress track accessibilityValue.now equals completedCount', () => {
        const { toJSON } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 5, totalCount: 10 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"now":5');
    });

    it('progress track accessibilityValue.max equals totalCount', () => {
        const { toJSON } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 3, totalCount: 8 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"max":8');
    });

    it('renders one progressbar per programme', () => {
        const programmes = [
            makeProgramme({ id: 'p1', completedCount: 3, totalCount: 8 }),
            makeProgramme({ id: 'p2', slug: 'sproutlyfe', icon_type: 'sprout', completedCount: 1, totalCount: 6 }),
        ];
        const { toJSON } = render(
            <ProgressSummaryCard programmes={programmes} onViewFull={onViewFull} colors={colors} />,
        );
        const json = JSON.stringify(toJSON());
        // Count occurrences of "progressbar" — one per programme
        const matches = json.match(/"progressbar"/g);
        expect(matches).not.toBeNull();
        expect(matches!.length).toBe(2);
    });

    it('progressbar accessibilityValue reflects zero progress', () => {
        const { toJSON } = render(
            <ProgressSummaryCard
                programmes={[makeProgramme({ completedCount: 0, totalCount: 5, percentage: 0 })]}
                onViewFull={onViewFull}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"now":0');
        expect(json).toContain('"max":5');
    });
});
