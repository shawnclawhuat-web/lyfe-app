import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AttendeeList from '@/components/events/AttendeeList';
import type { SelectedAttendee } from '@/hooks/useAttendeePicker';
import type { AttendeeRole, ExternalAttendee } from '@/types/event';

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

jest.mock('@/components/Avatar', () => {
    const { Text } = require('react-native');
    return { __esModule: true, default: ({ name }: any) => <Text>{name}</Text> };
});

jest.mock('@/constants/ui', () => ({
    ATTENDEE_ROLES: [
        { key: 'attendee', label: 'Attendee' },
        { key: 'host', label: 'Host' },
        { key: 'duty_manager', label: 'Duty Mgr' },
        { key: 'presenter', label: 'Presenter' },
    ],
    getAvatarColor: jest.fn(() => '#6366F1'),
}));

const makeInternal = (overrides?: Partial<SelectedAttendee>): SelectedAttendee => ({
    user_id: 'u1',
    full_name: 'Alice Tan',
    role: 'agent',
    attendee_role: 'attendee' as AttendeeRole,
    avatar_url: null,
    ...overrides,
});

const makeExternal = (
    overrides?: Partial<ExternalAttendee & { _key: string }>,
): ExternalAttendee & { _key: string } => ({
    _key: 'ext_1',
    name: 'Bob Guest',
    attendee_role: 'attendee' as AttendeeRole,
    ...overrides,
});

const defaultProps = {
    selectedAttendees: [],
    externalAttendees: [],
    onOpenPicker: jest.fn(),
    onUpdateRole: jest.fn(),
    onRemoveAttendee: jest.fn(),
    onUpdateExternalRole: jest.fn(),
    onRemoveExternal: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('AttendeeList', () => {
    it('shows "No attendees selected" when both arrays empty', () => {
        const { getByText } = render(<AttendeeList {...defaultProps} />);
        expect(getByText('No attendees selected')).toBeTruthy();
    });

    it('shows attendee count in label', () => {
        const props = {
            ...defaultProps,
            selectedAttendees: [makeInternal(), makeInternal({ user_id: 'u2', full_name: 'Carol Lim' })],
            externalAttendees: [],
        };
        const { getByText } = render(<AttendeeList {...props} />);
        expect(getByText('Attendees (2)')).toBeTruthy();
    });

    it('renders internal attendee names', () => {
        const props = {
            ...defaultProps,
            selectedAttendees: [
                makeInternal({ user_id: 'u1', full_name: 'Alice Tan' }),
                makeInternal({ user_id: 'u2', full_name: 'Carol Lim' }),
            ],
        };
        const { getAllByText } = render(<AttendeeList {...props} />);
        // Avatar mock also renders the name as Text, so each name appears at least once
        expect(getAllByText('Alice Tan').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Carol Lim').length).toBeGreaterThanOrEqual(1);
    });

    it('renders external attendee names with "Guest" badge', () => {
        const props = {
            ...defaultProps,
            externalAttendees: [makeExternal({ _key: 'ext_1', name: 'Bob Guest' })],
        };
        const { getAllByText } = render(<AttendeeList {...props} />);
        // Avatar mock also renders the name as Text, so the name appears at least once
        expect(getAllByText('Bob Guest').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('Guest').length).toBeGreaterThanOrEqual(1);
    });

    it('calls onOpenPicker when Add button pressed', () => {
        const onOpenPicker = jest.fn();
        const { getByText } = render(<AttendeeList {...defaultProps} onOpenPicker={onOpenPicker} />);
        fireEvent.press(getByText('Add'));
        expect(onOpenPicker).toHaveBeenCalledTimes(1);
    });

    it('calls onRemoveAttendee when remove icon pressed on internal attendee', () => {
        const onRemoveAttendee = jest.fn();
        const props = {
            ...defaultProps,
            selectedAttendees: [makeInternal({ user_id: 'u1', full_name: 'Alice Tan' })],
            onRemoveAttendee,
        };
        // Ionicons is mocked as string 'Ionicons'; find the remove button via its parent TouchableOpacity.
        // The close-circle button sits at the end of each attendee row.
        const { UNSAFE_getAllByType } = render(<AttendeeList {...props} />);
        const { TouchableOpacity } = require('react-native');
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        // Buttons: Add, role chips (4), remove — remove is last
        const removeBtn = buttons[buttons.length - 1];
        fireEvent.press(removeBtn);
        expect(onRemoveAttendee).toHaveBeenCalledWith('u1');
    });

    it('calls onRemoveExternal when remove icon pressed on external attendee', () => {
        const onRemoveExternal = jest.fn();
        const props = {
            ...defaultProps,
            externalAttendees: [makeExternal({ _key: 'ext_42', name: 'Dave External' })],
            onRemoveExternal,
        };
        const { UNSAFE_getAllByType } = render(<AttendeeList {...props} />);
        const { TouchableOpacity } = require('react-native');
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        const removeBtn = buttons[buttons.length - 1];
        fireEvent.press(removeBtn);
        expect(onRemoveExternal).toHaveBeenCalledWith('ext_42');
    });

    it('shows role chips (Attendee, Host, Duty Mgr, Presenter) for each attendee', () => {
        const props = {
            ...defaultProps,
            selectedAttendees: [makeInternal({ user_id: 'u1', full_name: 'Alice Tan' })],
        };
        const { getByText } = render(<AttendeeList {...props} />);
        expect(getByText('Attendee')).toBeTruthy();
        expect(getByText('Host')).toBeTruthy();
        expect(getByText('Duty Mgr')).toBeTruthy();
        expect(getByText('Presenter')).toBeTruthy();
    });

    it('calls onUpdateRole when role chip pressed on internal attendee', () => {
        const onUpdateRole = jest.fn();
        const props = {
            ...defaultProps,
            selectedAttendees: [makeInternal({ user_id: 'u1', full_name: 'Alice Tan', attendee_role: 'attendee' })],
            onUpdateRole,
        };
        const { getByText } = render(<AttendeeList {...props} />);
        fireEvent.press(getByText('Host'));
        expect(onUpdateRole).toHaveBeenCalledWith('u1', 'host');
    });

    it('calls onUpdateExternalRole when role chip pressed on external attendee', () => {
        const onUpdateExternalRole = jest.fn();
        const props = {
            ...defaultProps,
            externalAttendees: [makeExternal({ _key: 'ext_1', name: 'Bob Guest', attendee_role: 'attendee' })],
            onUpdateExternalRole,
        };
        const { getByText } = render(<AttendeeList {...props} />);
        fireEvent.press(getByText('Presenter'));
        expect(onUpdateExternalRole).toHaveBeenCalledWith('ext_1', 'presenter');
    });
});
