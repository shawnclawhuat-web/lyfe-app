/**
 * Tests for hooks/useEventForm.ts — Event create/edit form logic
 * Covers: validation, handlers (addExternal, removeAttendee, etc.), state management
 */
jest.mock('@/lib/supabase');
jest.mock('@/lib/events');
jest.mock('@/contexts/AuthContext');
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
    useLocalSearchParams: jest.fn(() => ({})),
    useFocusEffect: jest.fn((cb: () => void) => cb()),
    Link: 'Link',
    Tabs: { Screen: 'Screen' },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import { useEventForm } from '@/hooks/useEventForm';
import { fetchEventById, createEvent, fetchAllUsers } from '@/lib/events';

beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user-1', full_name: 'Manager Alice', role: 'manager' },
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (fetchEventById as jest.Mock).mockResolvedValue({ data: null, error: null });
    (createEvent as jest.Mock).mockResolvedValue({ data: { id: 'new-evt' }, error: null });
    (fetchAllUsers as jest.Mock).mockResolvedValue({
        data: [
            { id: 'u1', full_name: 'Alice', role: 'agent', avatar_url: null },
            { id: 'u2', full_name: 'Bob', role: 'agent', avatar_url: null },
        ],
        error: null,
    });
});

describe('useEventForm', () => {
    it('initializes with default values in create mode', () => {
        const { result } = renderHook(() => useEventForm());

        expect(result.current.isEditing).toBe(false);
        expect(result.current.title).toBe('');
        expect(result.current.eventType).toBe('team_meeting');
        expect(result.current.location).toBe('');
        expect(result.current.description).toBe('');
        expect(result.current.submitting).toBe(false);
        expect(result.current.errors).toEqual({});
    });

    it('updates title via setTitle', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.setTitle('My Event');
        });

        expect(result.current.title).toBe('My Event');
    });

    it('updates event type via setEventType', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.setEventType('training');
        });

        expect(result.current.eventType).toBe('training');
    });

    it('updates location and description', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.setLocation('Office A');
            result.current.setDescription('Weekly sync');
        });

        expect(result.current.location).toBe('Office A');
        expect(result.current.description).toBe('Weekly sync');
    });

    it('handleClearError removes a specific error key', () => {
        const { result } = renderHook(() => useEventForm());

        // Trigger validation to set errors (empty title)
        act(() => {
            result.current.handleSubmit();
        });

        // Should have title error
        expect(result.current.errors.title).toBeTruthy();

        // Clear it
        act(() => {
            result.current.handleClearError('title');
        });

        expect(result.current.errors.title).toBe('');
    });

    it('handleRemoveAttendee removes an attendee by userId', () => {
        const { result } = renderHook(() => useEventForm());

        // Add attendees first
        act(() => {
            result.current.attendeePicker.setSelectedAttendees([
                { user_id: 'u1', full_name: 'Alice', role: 'agent', attendee_role: 'attendee' },
                { user_id: 'u2', full_name: 'Bob', role: 'agent', attendee_role: 'attendee' },
            ]);
        });

        act(() => {
            result.current.handleRemoveAttendee('u1');
        });

        expect(result.current.attendeePicker.selectedAttendees).toHaveLength(1);
        expect(result.current.attendeePicker.selectedAttendees[0].user_id).toBe('u2');
    });

    it('handleAddExternal adds an external attendee', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.attendeePicker.setExternalName('John Client');
        });

        act(() => {
            result.current.handleAddExternal();
        });

        expect(result.current.attendeePicker.externalAttendees).toHaveLength(1);
        expect(result.current.attendeePicker.externalAttendees[0].name).toBe('John Client');
    });

    it('handleAddExternal does nothing when name is empty', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.attendeePicker.setExternalName('   ');
        });

        act(() => {
            result.current.handleAddExternal();
        });

        expect(result.current.attendeePicker.externalAttendees).toHaveLength(0);
    });

    it('handleRemoveExternal removes by key', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.attendeePicker.setExternalAttendees([
                { _key: 'ext_1', name: 'Alice', attendee_role: 'attendee' },
                { _key: 'ext_2', name: 'Bob', attendee_role: 'speaker' },
            ]);
        });

        act(() => {
            result.current.handleRemoveExternal('ext_1');
        });

        expect(result.current.attendeePicker.externalAttendees).toHaveLength(1);
        expect(result.current.attendeePicker.externalAttendees[0].name).toBe('Bob');
    });

    it('handleUpdateExternalRole changes role for a specific key', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.attendeePicker.setExternalAttendees([
                { _key: 'ext_1', name: 'Alice', attendee_role: 'attendee' },
            ]);
        });

        act(() => {
            result.current.handleUpdateExternalRole('ext_1', 'speaker');
        });

        expect(result.current.attendeePicker.externalAttendees[0].attendee_role).toBe('speaker');
    });

    it('handleCloseAttendeePicker resets picker state', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.attendeePicker.setShowAttendeePicker(true);
            result.current.attendeePicker.setUserSearch('search term');
            result.current.attendeePicker.setExternalName('Draft Name');
        });

        act(() => {
            result.current.handleCloseAttendeePicker();
        });

        expect(result.current.attendeePicker.showAttendeePicker).toBe(false);
        expect(result.current.attendeePicker.userSearch).toBe('');
        expect(result.current.attendeePicker.externalName).toBe('');
    });

    it('validates empty title and sets error', async () => {
        const { result } = renderHook(() => useEventForm());

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(result.current.errors.title).toBe('Title is required');
    });

    it('sets showDatePicker state correctly', () => {
        const { result } = renderHook(() => useEventForm());

        act(() => {
            result.current.setShowDatePicker('single');
        });

        expect(result.current.showDatePicker).toBe('single');

        act(() => {
            result.current.setShowDatePicker(null);
        });

        expect(result.current.showDatePicker).toBeNull();
    });

    it('exposes isEditing as false by default', () => {
        const { result } = renderHook(() => useEventForm());
        expect(result.current.isEditing).toBe(false);
    });

    it('exposes isEditing as true when eventId param is present', () => {
        (useLocalSearchParams as jest.Mock).mockReturnValue({ eventId: 'evt-1' });

        const { result } = renderHook(() => useEventForm());
        expect(result.current.isEditing).toBe(true);
        expect(result.current.loadingEvent).toBe(true);
    });
});
