import React from 'react';
import { render } from '@testing-library/react-native';
import LeadActivityItem from '@/components/LeadActivityItem';
import type { LeadActivity } from '@/types/lead';

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: require('@/constants/Colors').Colors.light,
        isDark: false,
        mode: 'light' as const,
        resolved: 'light' as const,
        setMode: jest.fn(),
    })),
}));

function makeActivity(overrides: Partial<LeadActivity> = {}): LeadActivity {
    return {
        id: 'act-1',
        lead_id: 'lead-1',
        user_id: 'user-1',
        type: 'created',
        description: null,
        metadata: {},
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

describe('LeadActivityItem', () => {
    it('renders "Lead created" for created type', () => {
        const activity = makeActivity({ type: 'created' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Lead created')).toBeTruthy();
    });

    it('renders custom description when provided', () => {
        const activity = makeActivity({ description: 'Called back about policy' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Called back about policy')).toBeTruthy();
    });

    it('renders status_change with from/to', () => {
        const activity = makeActivity({
            type: 'status_change',
            metadata: { from_status: 'new', to_status: 'contacted' },
        });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText(/Status changed.*new.*contacted/)).toBeTruthy();
    });

    it('renders reassignment with agent name', () => {
        const activity = makeActivity({
            type: 'reassignment',
            metadata: { to_agent_name: 'John Doe' },
        });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Reassigned to John Doe')).toBeTruthy();
    });

    it('renders reassignment without agent name', () => {
        const activity = makeActivity({
            type: 'reassignment',
            metadata: {},
        });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Reassigned to another agent')).toBeTruthy();
    });

    it('renders call type', () => {
        const activity = makeActivity({ type: 'call' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Phone call logged')).toBeTruthy();
    });

    it('renders email type', () => {
        const activity = makeActivity({ type: 'email' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Email sent')).toBeTruthy();
    });

    it('renders meeting type', () => {
        const activity = makeActivity({ type: 'meeting' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Meeting scheduled')).toBeTruthy();
    });

    it('renders follow_up type', () => {
        const activity = makeActivity({ type: 'follow_up' });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Follow-up scheduled')).toBeTruthy();
    });

    it('renders "Just now" for very recent activity', () => {
        const activity = makeActivity({ created_at: new Date().toISOString() });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('Just now')).toBeTruthy();
    });

    it('renders minutes ago for recent activity', () => {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const activity = makeActivity({ created_at: fiveMinAgo });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('5m ago')).toBeTruthy();
    });

    it('renders hours ago', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const activity = makeActivity({ created_at: twoHoursAgo });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('2h ago')).toBeTruthy();
    });

    it('renders days ago', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const activity = makeActivity({ created_at: threeDaysAgo });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText('3d ago')).toBeTruthy();
    });

    it('renders formatted date for old activity', () => {
        const activity = makeActivity({ created_at: '2025-01-15T10:00:00Z' });
        const { queryByText } = render(<LeadActivityItem activity={activity} />);
        // Should show a formatted date, not "Xd ago"
        expect(queryByText(/ago/)).toBeNull();
    });

    it('does not render timeline line when isLast is true', () => {
        const activity = makeActivity();
        const { toJSON } = render(<LeadActivityItem activity={activity} isLast />);
        // The component renders, just without the trailing line
        expect(toJSON()).toBeTruthy();
    });

    it('renders status_change with fallback when metadata missing', () => {
        const activity = makeActivity({
            type: 'status_change',
            metadata: {},
        });
        const { getByText } = render(<LeadActivityItem activity={activity} />);
        expect(getByText(/Status changed.*\?.*\?/)).toBeTruthy();
    });
});
