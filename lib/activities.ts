/**
 * Activity tracking service — log and query agent activities on leads.
 */
import type { LeadActivityType } from '@/types/lead';
import { captureError } from './sentry';
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
        captureError(err, { fn: 'getActivitySummary' });
        return {
            data: emptyResult,
            error: err instanceof Error ? err.message : 'Unknown error fetching activity summary',
        };
    }
}
