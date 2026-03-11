import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EventDateSection from '@/components/events/EventDateSection';

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: require('@/constants/Colors').Colors.light,
        isDark: false,
        mode: 'light',
        resolved: 'light',
        setMode: jest.fn(),
    })),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

jest.mock('@/lib/dateTime', () => ({
    formatDateLabel: jest.fn((d: string) => d),
    dateDiffDays: jest.fn((a: string, b: string) => {
        const da = new Date(a + 'T00:00:00');
        const db = new Date(b + 'T00:00:00');
        return Math.round((db.getTime() - da.getTime()) / 86400000);
    }),
    isValidDate: jest.fn((d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
}));

const defaultProps = {
    isRoadshow: false,
    isEditing: false,
    isEditingRoadshow: false,
    eventDate: '2026-03-10',
    rsStartDate: '',
    rsEndDate: '',
    errors: {},
    onOpenDatePicker: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('EventDateSection', () => {
    describe('non-roadshow mode', () => {
        it('shows "Date *" label', () => {
            const { getByText } = render(<EventDateSection {...defaultProps} />);
            expect(getByText('Date *')).toBeTruthy();
        });

        it("calls onOpenDatePicker('single') on press", () => {
            const onOpenDatePicker = jest.fn();
            const { getByText } = render(<EventDateSection {...defaultProps} onOpenDatePicker={onOpenDatePicker} />);
            fireEvent.press(getByText('2026-03-10'));
            expect(onOpenDatePicker).toHaveBeenCalledWith('single');
        });

        it('shows error text when errors.eventDate set', () => {
            const props = {
                ...defaultProps,
                errors: { eventDate: 'Date is required' },
            };
            const { getByText } = render(<EventDateSection {...props} />);
            expect(getByText('Date is required')).toBeTruthy();
        });
    });

    describe('roadshow mode (not editing)', () => {
        const roadshowProps = {
            ...defaultProps,
            isRoadshow: true,
            isEditing: false,
            isEditingRoadshow: false,
        };

        it('shows "Date Range *" label', () => {
            const { getByText } = render(<EventDateSection {...roadshowProps} />);
            expect(getByText('Date Range *')).toBeTruthy();
        });

        it("calls onOpenDatePicker('range') on press", () => {
            const onOpenDatePicker = jest.fn();
            const props = {
                ...roadshowProps,
                rsStartDate: '2026-03-10',
                rsEndDate: '2026-03-12',
                onOpenDatePicker,
            };
            const { getByText } = render(<EventDateSection {...props} />);
            fireEvent.press(getByText('2026-03-10 – 2026-03-12'));
            expect(onOpenDatePicker).toHaveBeenCalledWith('range');
        });

        it('shows range preview hint with day count when dates valid', () => {
            const props = {
                ...roadshowProps,
                rsStartDate: '2026-03-10',
                rsEndDate: '2026-03-12',
            };
            const { getByText } = render(<EventDateSection {...props} />);
            // 2026-03-10 to 2026-03-12 = 2 diff days + 1 = 3 daily events
            expect(getByText(/Creates 3 daily events/)).toBeTruthy();
        });

        it('shows range errors for rsStartDate and rsEndDate', () => {
            const props = {
                ...roadshowProps,
                errors: {
                    rsStartDate: 'Start date is required',
                    rsEndDate: 'End date must be after start',
                },
            };
            const { getByText } = render(<EventDateSection {...props} />);
            expect(getByText('Start date is required')).toBeTruthy();
            expect(getByText('End date must be after start')).toBeTruthy();
        });
    });

    describe('roadshow editing (locked)', () => {
        it('shows locked message and does not call onOpenDatePicker when pressed', () => {
            const onOpenDatePicker = jest.fn();
            const props = {
                ...defaultProps,
                isRoadshow: true,
                isEditing: true,
                isEditingRoadshow: true,
                onOpenDatePicker,
            };
            const { getByText } = render(<EventDateSection {...props} />);
            expect(
                getByText('Date is locked for roadshow events. To add more days, create a new roadshow.'),
            ).toBeTruthy();
            fireEvent.press(getByText('2026-03-10'));
            expect(onOpenDatePicker).not.toHaveBeenCalled();
        });
    });
});
