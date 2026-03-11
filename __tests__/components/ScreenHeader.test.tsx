import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ScreenHeader from '@/components/ScreenHeader';

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

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));
jest.mock('@/constants/platform', () => ({
    letterSpacing: (v: number) => v,
}));

beforeEach(() => jest.clearAllMocks());

describe('ScreenHeader', () => {
    it('renders title text', () => {
        const { getByText } = render(<ScreenHeader title="My Title" />);
        expect(getByText('My Title')).toBeTruthy();
    });

    it('renders custom titleElement instead of title text', () => {
        const { getByText, queryByText } = render(
            <ScreenHeader title="Fallback" titleElement={<Text>Custom Element</Text>} />,
        );
        expect(getByText('Custom Element')).toBeTruthy();
        expect(queryByText('Fallback')).toBeNull();
    });

    it('shows subtitle when provided', () => {
        const { getByText } = render(<ScreenHeader title="Title" subtitle="Subtitle text" />);
        expect(getByText('Subtitle text')).toBeTruthy();
    });

    it('shows back button when showBack=true', () => {
        const { UNSAFE_getAllByType } = render(<ScreenHeader title="Detail" showBack />);
        const { TouchableOpacity } = require('react-native');
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls router.back() when back pressed and no onBack provided', () => {
        const { useRouter } = require('expo-router');
        const mockBack = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), replace: jest.fn(), back: mockBack });

        const { UNSAFE_getAllByType } = render(<ScreenHeader title="Detail" showBack />);
        const { TouchableOpacity } = require('react-native');
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        fireEvent.press(buttons[0]);
        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('calls custom onBack when provided', () => {
        const onBack = jest.fn();
        const { UNSAFE_getAllByType } = render(<ScreenHeader title="Detail" showBack onBack={onBack} />);
        const { TouchableOpacity } = require('react-native');
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        fireEvent.press(buttons[0]);
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('shows backLabel next to back chevron', () => {
        const { getByText } = render(<ScreenHeader title="Detail" showBack backLabel="Leads" />);
        expect(getByText('Leads')).toBeTruthy();
    });

    it('renders rightAction content', () => {
        const { getByText } = render(<ScreenHeader title="Title" rightAction={<Text>Save</Text>} />);
        expect(getByText('Save')).toBeTruthy();
    });

    it('shows banner with text', () => {
        const { getByText } = render(<ScreenHeader title="Title" banner={{ text: 'Important notice' }} />);
        expect(getByText('Important notice')).toBeTruthy();
    });

    it('shows banner with icon', () => {
        const { getByText, UNSAFE_getAllByType } = render(
            <ScreenHeader title="Title" banner={{ text: 'Notice with icon', icon: 'alert-circle-outline' }} />,
        );
        expect(getByText('Notice with icon')).toBeTruthy();
        // Ionicons is rendered as the string tag 'Ionicons'; verify it appears in the tree
        const ionicons = UNSAFE_getAllByType('Ionicons' as any);
        expect(ionicons.length).toBeGreaterThanOrEqual(1);
    });

    it('hides back button when showBack is false', () => {
        const { queryByText } = render(<ScreenHeader title="Home" showBack={false} backLabel="Back" />);
        // backLabel text should not appear when showBack is false
        expect(queryByText('Back')).toBeNull();
    });

    it('hides back button when showBack is undefined', () => {
        const { queryByText } = render(<ScreenHeader title="Home" backLabel="Back" />);
        expect(queryByText('Back')).toBeNull();
    });
});
