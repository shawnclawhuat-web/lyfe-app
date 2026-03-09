/**
 * Notifications service — Supabase CRUD for in-app notification inbox
 */
import type { AppNotification } from '@/types/notification';
import { supabase } from './supabase';

/**
 * Fetch notifications for a user, newest first, paginated.
 */
export async function fetchNotifications(
    userId: string,
    page = 0,
    pageSize = 20,
): Promise<{ data: AppNotification[]; error: string | null; hasMore: boolean }> {
    const from = page * pageSize;
    const to = from + pageSize; // fetch one extra to detect hasMore

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) return { data: [], error: error.message, hasMore: false };

    const rows = (data || []) as AppNotification[];
    const hasMore = rows.length > pageSize;
    return {
        data: hasMore ? rows.slice(0, pageSize) : rows,
        error: null,
        hasMore,
    };
}

/**
 * Fetch the count of unread notifications for a user.
 */
export async function fetchUnreadCount(userId: string): Promise<{ count: number; error: string | null }> {
    const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0, error: null };
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    return { error: error ? error.message : null };
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    return { error: error ? error.message : null };
}
