import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NoteInput from '@/components/leads/NoteInput';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

describe('NoteInput', () => {
    const baseProps = {
        noteText: '',
        onChangeText: jest.fn(),
        isSaving: false,
        colors,
        onSave: jest.fn(),
        onCancel: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders "Add Note" title', () => {
        const { getByText } = render(<NoteInput {...baseProps} />);
        expect(getByText('Add Note')).toBeTruthy();
    });

    it('renders placeholder text', () => {
        const { getByPlaceholderText } = render(<NoteInput {...baseProps} />);
        expect(getByPlaceholderText('Write a note...')).toBeTruthy();
    });

    it('calls onChangeText when typing', () => {
        const onChangeText = jest.fn();
        const { getByPlaceholderText } = render(<NoteInput {...baseProps} onChangeText={onChangeText} />);
        fireEvent.changeText(getByPlaceholderText('Write a note...'), 'Hello');
        expect(onChangeText).toHaveBeenCalledWith('Hello');
    });

    it('calls onCancel when Cancel is pressed', () => {
        const onCancel = jest.fn();
        const { getByText } = render(<NoteInput {...baseProps} onCancel={onCancel} />);
        fireEvent.press(getByText('Cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when Save Note is pressed with text', () => {
        const onSave = jest.fn();
        const { getByText } = render(<NoteInput {...baseProps} noteText="My note" onSave={onSave} />);
        fireEvent.press(getByText('Save Note'));
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('disables Save button when text is empty', () => {
        const onSave = jest.fn();
        const { getByText } = render(<NoteInput {...baseProps} noteText="" onSave={onSave} />);
        fireEvent.press(getByText('Save Note'));
        expect(onSave).not.toHaveBeenCalled();
    });

    it('disables Save button when saving', () => {
        const onSave = jest.fn();
        const { getByText } = render(<NoteInput {...baseProps} noteText="My note" isSaving onSave={onSave} />);
        expect(getByText('Saving...')).toBeTruthy();
        fireEvent.press(getByText('Saving...'));
        expect(onSave).not.toHaveBeenCalled();
    });
});
