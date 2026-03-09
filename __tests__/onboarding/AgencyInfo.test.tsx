jest.mock('@/lib/supabase');
jest.mock('@/contexts/ThemeContext');
jest.mock('@/contexts/AuthContext');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import AgencyInfoScreen from '@/app/onboarding/AgencyInfo';

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
        user: { id: 'user-1', full_name: 'Test Agent', phone: '+6580000004', role: 'agent' },
    });
});

describe('AgencyInfoScreen', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Your Agency')).toBeTruthy();
    });

    it('shows subtitle', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Here is your agency information')).toBeTruthy();
    });

    it('shows assigned manager info', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Assigned Manager')).toBeTruthy();
        expect(getByText('Your Assigned Manager')).toBeTruthy();
    });

    it('shows team info', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Team')).toBeTruthy();
        expect(getByText('Lyfe Agency Team')).toBeTruthy();
    });

    it('shows licence info', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Licence')).toBeTruthy();
        expect(getByText('Income Insurance Ltd')).toBeTruthy();
    });

    it('shows role info', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText('Role')).toBeTruthy();
        expect(getByText('agent')).toBeTruthy();
    });

    it('shows the continue button', () => {
        const { getByTestId } = render(<AgencyInfoScreen />);
        expect(getByTestId('continue-button')).toBeTruthy();
    });

    it('navigates to FirstSteps on continue press', () => {
        const { getByTestId } = render(<AgencyInfoScreen />);
        fireEvent.press(getByTestId('continue-button'));
        expect(mockPush).toHaveBeenCalledWith('/onboarding/FirstSteps');
    });

    it('shows the info note card', () => {
        const { getByText } = render(<AgencyInfoScreen />);
        expect(getByText(/Contact your manager/)).toBeTruthy();
    });
});
