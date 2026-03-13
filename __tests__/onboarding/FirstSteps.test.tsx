import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import FirstStepsScreen from '@/app/onboarding/FirstSteps';

jest.mock('@/contexts/ThemeContext');

const mockPush = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
    });
    (useTheme as jest.Mock).mockReturnValue({
        colors: Colors.light,
        isDark: false,
        mode: 'light',
        resolved: 'light',
        setMode: jest.fn(),
    });
});

describe('FirstStepsScreen', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<FirstStepsScreen />);
        expect(getByText('First Steps')).toBeTruthy();
    });

    it('shows subtitle', () => {
        const { getByText } = render(<FirstStepsScreen />);
        expect(getByText('Complete these tasks to get started')).toBeTruthy();
    });

    it('shows all checklist items', () => {
        const { getByText } = render(<FirstStepsScreen />);
        expect(getByText('Complete your profile')).toBeTruthy();
        expect(getByText('Browse the training roadmap')).toBeTruthy();
        expect(getByText('Read the exam guide')).toBeTruthy();
    });

    it('shows the continue button', () => {
        const { getByTestId } = render(<FirstStepsScreen />);
        expect(getByTestId('continue-button')).toBeTruthy();
    });

    it('continue button is disabled when not all items checked', () => {
        const { getByTestId } = render(<FirstStepsScreen />);
        const button = getByTestId('continue-button');
        expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('toggles checklist items on press', () => {
        const { getByTestId, getByText } = render(<FirstStepsScreen />);
        fireEvent.press(getByTestId('checklist-profile'));
        // After toggling, the item text should still be present
        expect(getByText('Complete your profile')).toBeTruthy();
    });

    it('enables continue button when all items are checked', () => {
        const { getByTestId } = render(<FirstStepsScreen />);
        fireEvent.press(getByTestId('checklist-profile'));
        fireEvent.press(getByTestId('checklist-roadmap'));
        fireEvent.press(getByTestId('checklist-exam'));
        const button = getByTestId('continue-button');
        expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('navigates to OnboardingComplete when all checked and button pressed', () => {
        const { getByTestId } = render(<FirstStepsScreen />);
        fireEvent.press(getByTestId('checklist-profile'));
        fireEvent.press(getByTestId('checklist-roadmap'));
        fireEvent.press(getByTestId('checklist-exam'));
        fireEvent.press(getByTestId('continue-button'));
        expect(mockPush).toHaveBeenCalledWith('/onboarding/OnboardingComplete');
    });

    it('shows success banner when all items checked', () => {
        const { getByTestId, getByText } = render(<FirstStepsScreen />);
        fireEvent.press(getByTestId('checklist-profile'));
        fireEvent.press(getByTestId('checklist-roadmap'));
        fireEvent.press(getByTestId('checklist-exam'));
        expect(getByText('All tasks completed!')).toBeTruthy();
    });
});
