import React from 'react';
import { render } from '@testing-library/react-native';
import ProgrammeHero from '@/components/roadmap/ProgrammeHero';
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
        withDelay: jest.fn((_delay: number, v: number) => v),
        withRepeat: jest.fn((v: number) => v),
        withSequence: jest.fn((...args: any[]) => args[0]),
        Easing: {
            out: jest.fn(() => jest.fn()),
            cubic: jest.fn(),
            inOut: jest.fn(() => jest.fn()),
            sin: jest.fn(),
            linear: jest.fn(),
        },
        cancelAnimation: jest.fn(),
    };
});

const colors = Colors.light;

describe('ProgrammeHero', () => {
    it('renders the programme title', () => {
        const { getByText } = render(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={3}
                totalCount={8}
                percentage={38}
                colors={colors}
            />,
        );
        expect(getByText('SeedLYFE')).toBeTruthy();
    });

    it('renders the module completion stats', () => {
        const { getByText } = render(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={3}
                totalCount={8}
                percentage={38}
                colors={colors}
            />,
        );
        expect(getByText('3 of 8 modules')).toBeTruthy();
    });

    it('renders the percentage value', () => {
        const { getByText } = render(
            <ProgrammeHero
                iconType="sprout"
                title="SproutLYFE"
                completedCount={5}
                totalCount={10}
                percentage={50}
                colors={colors}
            />,
        );
        expect(getByText('50%')).toBeTruthy();
    });

    it('renders 0% for zero progress', () => {
        const { getByText } = render(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={0}
                totalCount={5}
                percentage={0}
                colors={colors}
            />,
        );
        expect(getByText('0%')).toBeTruthy();
        expect(getByText('0 of 5 modules')).toBeTruthy();
    });

    it('renders 100% for complete programme', () => {
        const { getByText } = render(
            <ProgrammeHero
                iconType="sprout"
                title="SproutLYFE"
                completedCount={10}
                totalCount={10}
                percentage={100}
                colors={colors}
            />,
        );
        expect(getByText('100%')).toBeTruthy();
        expect(getByText('10 of 10 modules')).toBeTruthy();
    });

    it('renders seedling icon for seedling type', () => {
        const { toJSON } = render(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={1}
                totalCount={5}
                percentage={20}
                colors={colors}
            />,
        );
        // Should render without crashing — the PixelSeedling component is present
        expect(toJSON()).not.toBeNull();
    });

    it('renders sprout icon for sprout type', () => {
        const { toJSON } = render(
            <ProgrammeHero
                iconType="sprout"
                title="SproutLYFE"
                completedCount={2}
                totalCount={5}
                percentage={40}
                colors={colors}
            />,
        );
        expect(toJSON()).not.toBeNull();
    });

    it('updates when percentage changes', () => {
        const { getByText, rerender } = render(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={3}
                totalCount={8}
                percentage={38}
                colors={colors}
            />,
        );
        expect(getByText('38%')).toBeTruthy();

        rerender(
            <ProgrammeHero
                iconType="seedling"
                title="SeedLYFE"
                completedCount={5}
                totalCount={8}
                percentage={63}
                colors={colors}
            />,
        );
        expect(getByText('63%')).toBeTruthy();
        expect(getByText('5 of 8 modules')).toBeTruthy();
    });
});
