/**
 * Tests for lib/notifications.ts — Notification service functions
 */
import { supabase } from '@/lib/supabase';

import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications';

jest.mock('@/lib/supabase');

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
    chain.__resolveWith(value);
}

// ── Fixtures ──

const NOTIFICATION = {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'roadshow_pledge',
    title: 'Alice pledged for Roadshow',
    body: 'S2 P3 C1 AFYC $5,000',
    data: { route: '/(tabs)/events/evt-1', eventId: 'evt-1' },
    is_read: false,
    created_at: '2026-03-10T10:00:00Z',
};

const NOTIFICATION_2 = {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'event_reminder',
    title: 'Upcoming Event',
    body: 'Team meeting tomorrow',
    data: { route: '/(tabs)/events/evt-2' },
    is_read: true,
    created_at: '2026-03-09T08:00:00Z',
};

beforeEach(() => {
    jest.clearAllMocks();
    mockSupa.__resetChains();
});

describe('fetchNotifications', () => {
    it('returns paginated notifications newest first', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { data: [NOTIFICATION, NOTIFICATION_2], error: null });

        const result = await fetchNotifications('user-1', 0, 20);

        expect(mockSupa.from).toHaveBeenCalledWith('notifications');
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('notif-1');
        expect(result.error).toBeNull();
        expect(result.hasMore).toBe(false);
    });

    it('detects hasMore when more items than pageSize', async () => {
        const items = Array.from({ length: 6 }, (_, i) => ({
            ...NOTIFICATION,
            id: `notif-${i}`,
        }));
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { data: items, error: null });

        const result = await fetchNotifications('user-1', 0, 5);

        expect(result.hasMore).toBe(true);
        expect(result.data).toHaveLength(5);
    });

    it('returns error on failure', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { data: null, error: { message: 'DB error' } });

        const result = await fetchNotifications('user-1');

        expect(result.data).toEqual([]);
        expect(result.error).toBe('DB error');
        expect(result.hasMore).toBe(false);
    });
});

describe('fetchUnreadCount', () => {
    it('returns count of unread notifications', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { count: 5, error: null });

        const result = await fetchUnreadCount('user-1');

        expect(result.count).toBe(5);
        expect(result.error).toBeNull();
    });

    it('returns 0 on error', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { count: null, error: { message: 'Failed' } });

        const result = await fetchUnreadCount('user-1');

        expect(result.count).toBe(0);
        expect(result.error).toBe('Failed');
    });
});

describe('markAsRead', () => {
    it('updates a single notification', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { error: null });

        const result = await markAsRead('notif-1');

        expect(mockSupa.from).toHaveBeenCalledWith('notifications');
        expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { error: { message: 'Update failed' } });

        const result = await markAsRead('notif-1');

        expect(result.error).toBe('Update failed');
    });
});

describe('markAllAsRead', () => {
    it('marks all unread notifications as read', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { error: null });

        const result = await markAllAsRead('user-1');

        expect(mockSupa.from).toHaveBeenCalledWith('notifications');
        expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
        const chain = mockSupa.__getChain('notifications');
        mockResolve(chain, { error: { message: 'Bulk update failed' } });

        const result = await markAllAsRead('user-1');

        expect(result.error).toBe('Bulk update failed');
    });
});
