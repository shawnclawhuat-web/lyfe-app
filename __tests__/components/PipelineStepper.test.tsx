import React from 'react';
import { render } from '@testing-library/react-native';
import PipelineStepper from '@/components/PipelineStepper';
import { CANDIDATE_STATUS_CONFIG, type CandidateStatus } from '@/types/recruitment';

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: require('@/constants/Colors').Colors.light,
        isDark: false,
        mode: 'light' as const,
        resolved: 'light' as const,
        setMode: jest.fn(),
    })),
}));

describe('PipelineStepper', () => {
    const allStatuses: CandidateStatus[] = [
        'applied',
        'interview_scheduled',
        'interviewed',
        'approved',
        'exam_prep',
        'licensed',
        'active_agent',
    ];

    it('renders all step labels', () => {
        const { getByText } = render(<PipelineStepper currentStatus="applied" />);
        for (const status of allStatuses) {
            expect(getByText(CANDIDATE_STATUS_CONFIG[status].label)).toBeTruthy();
        }
    });

    it('renders with first status as current', () => {
        const { getByText } = render(<PipelineStepper currentStatus="applied" />);
        expect(getByText('Applied')).toBeTruthy();
    });

    it('renders with middle status as current', () => {
        const { getByText } = render(<PipelineStepper currentStatus="approved" />);
        expect(getByText('Approved')).toBeTruthy();
    });

    it('renders with last status as current', () => {
        const { getByText } = render(<PipelineStepper currentStatus="active_agent" />);
        expect(getByText('Active Agent')).toBeTruthy();
    });

    it('renders each status without crashing', () => {
        for (const status of allStatuses) {
            const { unmount } = render(<PipelineStepper currentStatus={status} />);
            unmount();
        }
    });
});
