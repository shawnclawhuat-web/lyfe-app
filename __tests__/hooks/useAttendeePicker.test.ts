import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAttendeePicker } from '@/hooks/useAttendeePicker';

jest.mock('@/lib/supabase');
jest.mock('@/lib/events', () => ({
    fetchAllUsers: jest.fn().mockResolvedValue({
        data: [
            { id: 'u1', full_name: 'Alice Wong', role: 'agent', avatar_url: null },
            { id: 'u2', full_name: 'Bob Tan', role: 'manager', avatar_url: null },
        ],
        error: null,
    }),
}));

describe('useAttendeePicker', () => {
    it('loads users on mount', async () => {
        const { result } = renderHook(() => useAttendeePicker());
        await waitFor(() => expect(result.current.loadingUsers).toBe(false));
        expect(result.current.filteredUsers).toHaveLength(2);
    });

    it('toggleAttendee adds and removes', async () => {
        const { result } = renderHook(() => useAttendeePicker());
        await waitFor(() => expect(result.current.loadingUsers).toBe(false));

        const user = { id: 'u1', full_name: 'Alice Wong', role: 'agent', avatar_url: null };
        act(() => result.current.toggleAttendee(user));
        expect(result.current.selectedAttendees).toHaveLength(1);
        expect(result.current.selectedAttendees[0].user_id).toBe('u1');

        act(() => result.current.toggleAttendee(user));
        expect(result.current.selectedAttendees).toHaveLength(0);
    });

    it('updateAttendeeRole changes role', async () => {
        const { result } = renderHook(() => useAttendeePicker());
        await waitFor(() => expect(result.current.loadingUsers).toBe(false));

        const user = { id: 'u1', full_name: 'Alice Wong', role: 'agent', avatar_url: null };
        act(() => result.current.toggleAttendee(user));
        act(() => result.current.updateAttendeeRole('u1', 'host'));
        expect(result.current.selectedAttendees[0].attendee_role).toBe('host');
    });

    it('filters users by search', async () => {
        const { result } = renderHook(() => useAttendeePicker());
        await waitFor(() => expect(result.current.loadingUsers).toBe(false));

        act(() => result.current.setUserSearch('alice'));
        expect(result.current.filteredUsers).toHaveLength(1);
        expect(result.current.filteredUsers[0].full_name).toBe('Alice Wong');
    });

    it('addExternal adds external attendee', () => {
        const { result } = renderHook(() => useAttendeePicker());
        act(() => {
            result.current.setExternalName('Guest');
            result.current.setExternalRole('attendee');
        });
        act(() => result.current.addExternal());
        expect(result.current.externalAttendees).toHaveLength(1);
        expect(result.current.externalAttendees[0].name).toBe('Guest');
        expect(result.current.externalName).toBe('');
    });

    it('removeExternal removes by key', () => {
        const { result } = renderHook(() => useAttendeePicker());
        act(() => {
            result.current.setExternalName('Guest');
        });
        act(() => result.current.addExternal());
        const key = result.current.externalAttendees[0]._key;
        act(() => result.current.removeExternal(key));
        expect(result.current.externalAttendees).toHaveLength(0);
    });
});
