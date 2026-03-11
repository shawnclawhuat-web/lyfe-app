import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReassignModal from '@/components/leads/ReassignModal';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

describe('ReassignModal', () => {
    const agents = [
        { id: 'a1', full_name: 'Alice Tan' },
        { id: 'a2', full_name: 'Bob Lee' },
    ];

    const baseProps = {
        visible: true,
        leadName: 'Jane Doe',
        agents,
        colors,
        onSelect: jest.fn(),
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders title and subtitle', () => {
        const { getByText } = render(<ReassignModal {...baseProps} />);
        expect(getByText('Reassign Lead')).toBeTruthy();
        expect(getByText('Select an agent to reassign Jane Doe to')).toBeTruthy();
    });

    it('renders agent list', () => {
        const { getByText } = render(<ReassignModal {...baseProps} />);
        expect(getByText('Alice Tan')).toBeTruthy();
        expect(getByText('Bob Lee')).toBeTruthy();
    });

    it('calls onSelect when agent is pressed', () => {
        const onSelect = jest.fn();
        const { getByText } = render(<ReassignModal {...baseProps} onSelect={onSelect} />);
        fireEvent.press(getByText('Alice Tan'));
        expect(onSelect).toHaveBeenCalledWith({ id: 'a1', full_name: 'Alice Tan' });
    });

    it('calls onClose when Cancel is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(<ReassignModal {...baseProps} onClose={onClose} />);
        fireEvent.press(getByText('Cancel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders empty message when no agents', () => {
        const { getByText } = render(<ReassignModal {...baseProps} agents={[]} />);
        expect(getByText('No agents available')).toBeTruthy();
    });
});
