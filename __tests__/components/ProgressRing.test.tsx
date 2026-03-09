import React from 'react';
import { render } from '@testing-library/react-native';
import ProgressRing from '@/components/events/ProgressRing';

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

describe('ProgressRing', () => {
    it('renders the actual value', () => {
        const { getByText } = render(
            <ProgressRing actual={5} pledged={10} color="#34C759" label="Contacts" accessLabel="5 of 10 contacts" />,
        );
        expect(getByText('5')).toBeTruthy();
    });

    it('renders the label', () => {
        const { getByText } = render(
            <ProgressRing actual={3} pledged={8} color="#007AFF" label="Leads" accessLabel="3 of 8 leads" />,
        );
        expect(getByText('Leads')).toBeTruthy();
    });

    it('renders "of {pledged}" when pledged > 0', () => {
        const { getByText } = render(
            <ProgressRing actual={2} pledged={10} color="#34C759" label="Cases" accessLabel="2 of 10 cases" />,
        );
        expect(getByText('of 10')).toBeTruthy();
    });

    it('renders "No target" when pledged is 0', () => {
        const { getByText } = render(
            <ProgressRing actual={0} pledged={0} color="#FF9500" label="Calls" accessLabel="0 calls, no target" />,
        );
        expect(getByText('No target')).toBeTruthy();
    });

    it('has correct accessibility label', () => {
        const { getByLabelText } = render(
            <ProgressRing actual={7} pledged={10} color="#34C759" label="Contacts" accessLabel="7 of 10 contacts" />,
        );
        expect(getByLabelText('7 of 10 contacts')).toBeTruthy();
    });

    it('renders when actual exceeds pledged', () => {
        const { getByText } = render(
            <ProgressRing actual={15} pledged={10} color="#34C759" label="Contacts" accessLabel="15 of 10" />,
        );
        expect(getByText('15')).toBeTruthy();
        expect(getByText('of 10')).toBeTruthy();
    });

    it('renders with zero actual', () => {
        const { getByText } = render(
            <ProgressRing actual={0} pledged={5} color="#007AFF" label="Leads" accessLabel="0 of 5 leads" />,
        );
        expect(getByText('0')).toBeTruthy();
        expect(getByText('of 5')).toBeTruthy();
    });
});
