jest.mock('@/lib/supabase');
jest.mock('@/contexts/ThemeContext');
jest.mock('@/contexts/AuthContext');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import ProfileSetupScreen from '@/app/onboarding/ProfileSetup';

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
    (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', full_name: 'New User', phone: '+6580000004', role: 'agent' },
    });
});

describe('ProfileSetupScreen', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<ProfileSetupScreen />);
        expect(getByText('Set Up Your Profile')).toBeTruthy();
    });

    it('shows subtitle text', () => {
        const { getByText } = render(<ProfileSetupScreen />);
        expect(getByText('Tell us a bit about yourself')).toBeTruthy();
    });

    it('shows the name input', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        expect(getByTestId('name-input')).toBeTruthy();
    });

    it('shows the phone input as read-only', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        const phoneInput = getByTestId('phone-input');
        expect(phoneInput).toBeTruthy();
        expect(phoneInput.props.editable).toBe(false);
    });

    it('shows the NRIC input', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        expect(getByTestId('nric-input')).toBeTruthy();
    });

    it('shows the photo placeholder', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        expect(getByTestId('photo-placeholder')).toBeTruthy();
    });

    it('shows the continue button', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        expect(getByTestId('continue-button')).toBeTruthy();
    });

    it('shows validation errors when fields are empty', () => {
        const { getByTestId, getByText } = render(<ProfileSetupScreen />);
        fireEvent.press(getByTestId('continue-button'));
        expect(getByText('Name is required')).toBeTruthy();
        expect(getByText('NRIC last 4 digits is required')).toBeTruthy();
    });

    it('navigates to AgencyInfo when form is valid', () => {
        const { getByTestId } = render(<ProfileSetupScreen />);
        fireEvent.changeText(getByTestId('name-input'), 'John Doe');
        fireEvent.changeText(getByTestId('nric-input'), '1234');
        fireEvent.press(getByTestId('continue-button'));
        expect(mockPush).toHaveBeenCalledWith('/onboarding/AgencyInfo');
    });

    it('shows NRIC validation error for non-4-digit input', () => {
        const { getByTestId, getByText } = render(<ProfileSetupScreen />);
        fireEvent.changeText(getByTestId('name-input'), 'John Doe');
        fireEvent.changeText(getByTestId('nric-input'), '12');
        fireEvent.press(getByTestId('continue-button'));
        expect(getByText('Must be exactly 4 digits')).toBeTruthy();
    });
});
