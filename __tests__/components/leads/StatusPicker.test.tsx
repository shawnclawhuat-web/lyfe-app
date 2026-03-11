import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatusPicker from '@/components/leads/StatusPicker';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

describe('StatusPicker', () => {
    const baseProps = {
        currentStatus: 'new' as const,
        isUpdating: false,
        colors,
        onChangeStatus: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders "Change Status" title', () => {
        const { getByText } = render(<StatusPicker {...baseProps} />);
        expect(getByText('Change Status')).toBeTruthy();
    });

    it('renders all status options', () => {
        const { getByText } = render(<StatusPicker {...baseProps} />);
        expect(getByText('New')).toBeTruthy();
        expect(getByText('Contacted')).toBeTruthy();
        expect(getByText('Qualified')).toBeTruthy();
        expect(getByText('Proposed')).toBeTruthy();
        expect(getByText('Won')).toBeTruthy();
        expect(getByText('Lost')).toBeTruthy();
    });

    it('calls onChangeStatus when a status is pressed', () => {
        const onChangeStatus = jest.fn();
        const { getByText } = render(<StatusPicker {...baseProps} onChangeStatus={onChangeStatus} />);
        fireEvent.press(getByText('Contacted'));
        expect(onChangeStatus).toHaveBeenCalledWith('contacted');
    });

    it('does not call onChangeStatus when isUpdating', () => {
        const onChangeStatus = jest.fn();
        const { getByText } = render(<StatusPicker {...baseProps} isUpdating onChangeStatus={onChangeStatus} />);
        fireEvent.press(getByText('Contacted'));
        expect(onChangeStatus).not.toHaveBeenCalled();
    });
});
