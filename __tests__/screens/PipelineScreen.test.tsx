/**
 * Tests for app/(tabs)/home/pipeline.tsx — Candidate Pipeline Funnel
 */
jest.mock('@/lib/supabase');
jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/ThemeContext');
jest.mock('@/hooks/useTypedRouter');

jest.mock('react-native-reanimated', () => {
    const { View } = require('react-native');
    const React = require('react');
    const AnimatedView = React.forwardRef((props: any, ref: any) => <View ref={ref} {...props} />);
    AnimatedView.displayName = 'AnimatedView';
    return {
        __esModule: true,
        default: { View: AnimatedView },
        FadeInDown: {
            delay: () => ({
                duration: () => ({
                    springify: () => undefined,
                }),
            }),
        },
        useSharedValue: jest.fn((v: number) => ({ value: v })),
        useAnimatedStyle: jest.fn(() => ({})),
        useDerivedValue: jest.fn((fn: () => any) => ({ value: fn() })),
        useAnimatedProps: jest.fn(() => ({})),
        withTiming: jest.fn((v: number) => v),
        withRepeat: jest.fn((v: any) => v),
        withSpring: jest.fn((v: number) => v),
    };
});

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypedRouter } from '@/hooks/useTypedRouter';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import PipelineScreen from '@/app/(tabs)/home/pipeline';

const mockPush = jest.fn();
const mockBack = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    (useTheme as jest.Mock).mockReturnValue({
        colors: Colors.light,
        isDark: false,
        mode: 'light',
        resolved: 'light',
        setMode: jest.fn(),
    });

    (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'mgr-1', full_name: 'Manager User', role: 'manager', avatar_url: null },
    });

    (useTypedRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: mockBack,
    });
});

function mockSupabaseQuery(data: any[] | null, error: any = null) {
    const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error }),
        then: undefined as any,
    };
    // Make chain thenable for await
    chain.eq = jest.fn().mockReturnValue(Promise.resolve({ data, error }));

    (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(Promise.resolve({ data, error })),
        }),
    });
}

describe('PipelineScreen', () => {
    it('renders screen header', () => {
        mockSupabaseQuery([]);
        const { getByText } = render(<PipelineScreen />);
        expect(getByText('Candidate Pipeline')).toBeTruthy();
    });

    it('renders empty state when no candidates', async () => {
        mockSupabaseQuery([]);
        const { getByText } = render(<PipelineScreen />);

        await waitFor(() => {
            expect(getByText('No candidates yet')).toBeTruthy();
            expect(
                getByText('Start recruiting candidates to see your pipeline funnel here.'),
            ).toBeTruthy();
        });
    });

    it('renders funnel stages with candidate counts', async () => {
        mockSupabaseQuery([
            { status: 'applied' },
            { status: 'applied' },
            { status: 'applied' },
            { status: 'interview_scheduled' },
            { status: 'interview_scheduled' },
            { status: 'approved' },
            { status: 'exam_prep' },
            { status: 'active_agent' },
        ]);

        const { getByText } = render(<PipelineScreen />);

        await waitFor(() => {
            expect(getByText('8 total candidates in pipeline')).toBeTruthy();
            expect(getByText('Applied')).toBeTruthy();
            expect(getByText('Interview')).toBeTruthy();
            expect(getByText('Approved')).toBeTruthy();
            expect(getByText('Exam Prep')).toBeTruthy();
            expect(getByText('Onboarded')).toBeTruthy();
        });
    });

    it('shows conversion rates between stages', async () => {
        mockSupabaseQuery([
            { status: 'applied' },
            { status: 'applied' },
            { status: 'applied' },
            { status: 'applied' },
            { status: 'interview_scheduled' },
            { status: 'interview_scheduled' },
            { status: 'approved' },
        ]);

        const { getAllByText } = render(<PipelineScreen />);

        await waitFor(() => {
            // 2/4 = 50% conversion from applied to interview
            expect(getAllByText('50% conversion').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('renders singular candidate text for 1 total', async () => {
        mockSupabaseQuery([{ status: 'applied' }]);

        const { getByText } = render(<PipelineScreen />);

        await waitFor(() => {
            expect(getByText('1 total candidate in pipeline')).toBeTruthy();
        });
    });
});
