/**
 * Activity tracking service — log and query agent activities on leads.
 */
import type { LeadActivity, LeadActivityType } from '@/types/lead';
import { supabase } from './supabase';

// ── Types ────────────────────────────────────────────────────

export interface ActivitySummary {
    agentId: string;
    totalActivities: number;
    byType: { type: LeadActivityType; count: number }[];
    dateRange: { start: string; end: string };
}

// ── Functions ────────────────────────────────────────────────

/**
 * Log an activity (call, meeting, follow-up, etc.) against a lead.
 * Also bumps the lead's updated_at timestamp.
 */
export async function logActivity(
    leadId: string,
    type: LeadActivityType,
    note: string | null,
    userId: string,
    metadata: Record<string, unknown> = {},
): Promise<{ data: LeadActivity | null; error: string | null }> {
    try {
        // Bump lead updated_at
        await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);

        const { data, error } = await supabase
            .from('lead_activities')
            .insert({
                lead_id: leadId,
                user_id: userId,
                type,
                description: note,
                metadata,
            })
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data: data as LeadActivity, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err.message : 'Unknown error logging activity' };
    }
}

/**
 * Get all activities for a specific lead, ordered by most recent first.
 */
export async function getActivitiesByLead(
    leadId: string,
): Promise<{ data: LeadActivity[]; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('lead_activities')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) return { data: [], error: error.message };
        return { data: (data || []) as LeadActivity[], error: null };
    } catch (err) {
        return { data: [], error: err instanceof Error ? err.message : 'Unknown error fetching activities' };
    }
}

/**
 * Get an activity summary for a specific agent within a date range.
 * Returns counts grouped by activity type.
 *
 * @param agentId - The agent's user ID
 * @param dateRange - Start and end dates (YYYY-MM-DD). Start must be before or equal to end.
 * @returns Activity summary with counts by type, or an error message
 */
export async function getAgentActivitySummary(
    agentId: string,
    dateRange: { start: string; end: string },
): Promise<{ data: ActivitySummary; error: string | null }> {
    const emptyResult: ActivitySummary = {
        agentId,
        totalActivities: 0,
        byType: [],
        dateRange,
    };

    try {
        // Validate date range: start must be <= end
        if (dateRange.start > dateRange.end) {
            return { data: emptyResult, error: 'Invalid date range: start must be before or equal to end' };
        }
        const { data, error } = await supabase
            .from('lead_activities')
            .select('type')
            .eq('user_id', agentId)
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end);

        if (error) return { data: emptyResult, error: error.message };

        const activities = (data || []) as { type: string }[];

        // Count by type
        const typeCounts: Record<string, number> = {};
        activities.forEach((a) => {
            typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
        });

        const byType = Object.entries(typeCounts).map(([type, count]) => ({
            type: type as LeadActivityType,
            count,
        }));

        return {
            data: {
                agentId,
                totalActivities: activities.length,
                byType,
                dateRange,
            },
            error: null,
        };
    } catch (err) {
        return {
            data: emptyResult,
            error: err instanceof Error ? err.message : 'Unknown error fetching activity summary',
        };
    }
}
