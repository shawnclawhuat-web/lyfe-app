import type { UserRole } from '@/types/database';
import { supabase } from './supabase';

/**
 * Fetch users who directly report to a manager.
 * Single source of truth for the `reports_to` relationship.
 *
 * @param managerId - the manager's user ID
 * @param opts.roleFilter - optional role to restrict results (e.g. 'agent')
 */
export async function getDirectReports(
    managerId: string,
    opts: { roleFilter?: UserRole } = {},
): Promise<{ data: { id: string; full_name: string }[]; error: string | null }> {
    let query = supabase
        .from('users')
        .select('id, full_name')
        .eq('reports_to', managerId)
        .eq('is_active', true);

    if (opts.roleFilter) {
        query = query.eq('role', opts.roleFilter);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data || []) as { id: string; full_name: string }[], error: null };
}
