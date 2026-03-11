/**
 * NotificationContext — provides unread count + mark-as-read helpers.
 *
 * Subscribes to Supabase Realtime INSERT on the notifications table
 * so the badge updates instantly when a new notification arrives.
 */
import { useAuth } from '@/contexts/AuthContext';
import { fetchUnreadCount, markAllAsRead as markAllAsReadSvc, markAsRead as markAsReadSvc } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!user?.id) return;
        const { count } = await fetchUnreadCount(user.id);
        setUnreadCount(count);
    }, [user?.id]);

    // Fetch on mount + when user changes
    useEffect(() => {
        if (!user?.id) {
            setUnreadCount(0);
            return;
        }
        refreshUnreadCount();
    }, [user?.id, refreshUnreadCount]);

    // Subscribe to realtime INSERT → increment count
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    setUnreadCount((prev) => prev + 1);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const markAsRead = useCallback(async (id: string) => {
        // Optimistic decrement
        setUnreadCount((prev) => Math.max(0, prev - 1));
        const { error } = await markAsReadSvc(id);
        if (error) {
            // Rollback on error
            setUnreadCount((prev) => prev + 1);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;
        const prevCount = unreadCount;
        // Optimistic reset
        setUnreadCount(0);
        const { error } = await markAllAsReadSvc(user.id);
        if (error) {
            // Rollback on error
            setUnreadCount(prevCount);
        }
    }, [user?.id, unreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
