import React from 'react';
import { render } from '@testing-library/react-native';
import StatusBadge from '@/components/StatusBadge';
import { STATUS_CONFIG, type LeadStatus } from '@/types/lead';

describe('StatusBadge', () => {
    const allStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'];

    it('renders the correct label for each status', () => {
        for (const status of allStatuses) {
            const { getByText, unmount } = render(<StatusBadge status={status} />);
            expect(getByText(STATUS_CONFIG[status].label)).toBeTruthy();
            unmount();
        }
    });

    it('renders with small size by default', () => {
        const { getByText } = render(<StatusBadge status="new" />);
        const badge = getByText('New');
        expect(badge.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 12 })]));
    });

    it('renders with medium size', () => {
        const { getByText } = render(<StatusBadge status="new" size="medium" />);
        const badge = getByText('New');
        expect(badge.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 13 })]));
    });

    it('uses correct status color in text', () => {
        const { getByText } = render(<StatusBadge status="won" />);
        const text = getByText('Won');
        expect(text.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ color: STATUS_CONFIG.won.color })]),
        );
    });
});
