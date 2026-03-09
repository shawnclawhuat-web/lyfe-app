import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Colors } from '@/constants/Colors';

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: require('@/constants/Colors').Colors.light,
        isDark: false,
        mode: 'light' as const,
        resolved: 'light' as const,
        setMode: jest.fn(),
    })),
}));

describe('ConfirmDialog', () => {
    const defaultButtons = [
        { text: 'Cancel', style: 'cancel' as const, onPress: jest.fn() },
        { text: 'Delete', style: 'destructive' as const, onPress: jest.fn() },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when not visible', () => {
        const { toJSON } = render(
            <ConfirmDialog visible={false} title="Test" message="Are you sure?" buttons={defaultButtons} />,
        );
        expect(toJSON()).toBeNull();
    });

    it('renders title and message when visible', () => {
        const { getByText } = render(
            <ConfirmDialog
                visible={true}
                title="Confirm Delete"
                message="This cannot be undone."
                buttons={defaultButtons}
            />,
        );
        expect(getByText('Confirm Delete')).toBeTruthy();
        expect(getByText('This cannot be undone.')).toBeTruthy();
    });

    it('renders all buttons', () => {
        const { getByText } = render(
            <ConfirmDialog visible={true} title="Test" message="Msg" buttons={defaultButtons} />,
        );
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Delete')).toBeTruthy();
    });

    it('calls onPress when button is pressed', () => {
        const onCancel = jest.fn();
        const onDelete = jest.fn();
        const buttons = [
            { text: 'Cancel', style: 'cancel' as const, onPress: onCancel },
            { text: 'Delete', style: 'destructive' as const, onPress: onDelete },
        ];

        const { getByText } = render(<ConfirmDialog visible={true} title="Test" message="Msg" buttons={buttons} />);

        fireEvent.press(getByText('Cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);

        fireEvent.press(getByText('Delete'));
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('handles button without onPress', () => {
        const buttons = [{ text: 'OK', style: 'default' as const }];
        const { getByText } = render(<ConfirmDialog visible={true} title="Info" message="Done." buttons={buttons} />);
        // Should not throw
        fireEvent.press(getByText('OK'));
    });

    it('renders default style button when style is undefined', () => {
        const buttons = [{ text: 'Proceed', onPress: jest.fn() }];
        const { getByText } = render(<ConfirmDialog visible={true} title="Test" message="Msg" buttons={buttons} />);
        expect(getByText('Proceed')).toBeTruthy();
    });

    it('renders multiple buttons in a row', () => {
        const buttons = [
            { text: 'No', style: 'cancel' as const, onPress: jest.fn() },
            { text: 'Yes', style: 'default' as const, onPress: jest.fn() },
            { text: 'Remove', style: 'destructive' as const, onPress: jest.fn() },
        ];
        const { getByText } = render(
            <ConfirmDialog visible={true} title="Choose" message="Pick one" buttons={buttons} />,
        );
        expect(getByText('No')).toBeTruthy();
        expect(getByText('Yes')).toBeTruthy();
        expect(getByText('Remove')).toBeTruthy();
    });
});
