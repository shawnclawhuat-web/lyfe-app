import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useLeadRealtime(onNewLead: (payload: any) => void) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`leads:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'leads',
                    filter: `assigned_to=eq.${user.id}`,
                },
                (payload) => {
                    onNewLead(payload.new);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, onNewLead]);
}
