import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ContactConfirmModal from '@/components/leads/ContactConfirmModal';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

describe('ContactConfirmModal', () => {
    const baseProps = {
        visible: true,
        leadName: 'Jane Doe',
        colors,
        onConfirm: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders call variant with "Reached them" and "No answer" buttons', () => {
        const { getByText } = render(<ContactConfirmModal {...baseProps} contactType="call" />);
        expect(getByText('How did the call go?')).toBeTruthy();
        expect(getByText('With Jane Doe')).toBeTruthy();
        expect(getByText('Reached them')).toBeTruthy();
        expect(getByText('No answer')).toBeTruthy();
    });

    it('renders whatsapp variant with "Yes, sent" button', () => {
        const { getByText, queryByText } = render(<ContactConfirmModal {...baseProps} contactType="whatsapp" />);
        expect(getByText('Did you send the message?')).toBeTruthy();
        expect(getByText('To Jane Doe')).toBeTruthy();
        expect(getByText('Yes, sent')).toBeTruthy();
        expect(queryByText('Reached them')).toBeNull();
    });

    it('calls onConfirm("reached") when "Reached them" is pressed', () => {
        const onConfirm = jest.fn();
        const { getByText } = render(<ContactConfirmModal {...baseProps} contactType="call" onConfirm={onConfirm} />);
        fireEvent.press(getByText('Reached them'));
        expect(onConfirm).toHaveBeenCalledWith('reached');
    });

    it('calls onConfirm("no_answer") when "No answer" is pressed', () => {
        const onConfirm = jest.fn();
        const { getByText } = render(<ContactConfirmModal {...baseProps} contactType="call" onConfirm={onConfirm} />);
        fireEvent.press(getByText('No answer'));
        expect(onConfirm).toHaveBeenCalledWith('no_answer');
    });

    it('calls onConfirm("sent") when "Yes, sent" is pressed', () => {
        const onConfirm = jest.fn();
        const { getByText } = render(
            <ContactConfirmModal {...baseProps} contactType="whatsapp" onConfirm={onConfirm} />,
        );
        fireEvent.press(getByText('Yes, sent'));
        expect(onConfirm).toHaveBeenCalledWith('sent');
    });

    it('calls onConfirm("skip") when skip is pressed', () => {
        const onConfirm = jest.fn();
        const { getByText } = render(<ContactConfirmModal {...baseProps} contactType="call" onConfirm={onConfirm} />);
        fireEvent.press(getByText("Skip — don't log"));
        expect(onConfirm).toHaveBeenCalledWith('skip');
    });
});
