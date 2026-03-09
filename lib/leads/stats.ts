/**
 * Lead stats & dashboard aggregations
 */
import type { LeadActivity, LeadStatus } from '@/types/lead';
import { supabase } from '../supabase';

export interface LeadPipelineStats {
    totalLeads: number;
    newThisWeek: number;
    conversionRate: number;
    activeFollowUps: number;
    pipeline: { status: LeadStatus; count: number }[];
}

export interface ManagerDashboardStats {
    activeCandidates: number;
    agentsManaged: number;
}

/**
 * Fetch aggregate pipeline stats for the home dashboard.
 */
export async function fetchLeadStats(
    userId: string,
    isManager: boolean,
): Promise<{ data: LeadPipelineStats; error: string | null }> {
    let query = supabase.from('leads').select('id, status, created_at');

    if (!isManager) {
        query = query.eq('assigned_to', userId);
    }

    const { data: leads, error } = await query;
    if (error) {
        return {
            data: { totalLeads: 0, newThisWeek: 0, conversionRate: 0, activeFollowUps: 0, pipeline: [] },
            error: error.message,
        };
    }

    const allLeads = leads || [];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const newThisWeek = allLeads.filter((l) => l.created_at >= weekAgo && l.status === 'new').length;
    const wonCount = allLeads.filter((l) => l.status === 'won').length;
    const closedCount = allLeads.filter((l) => l.status === 'won' || l.status === 'lost').length;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
    const activeFollowUps = allLeads.filter(
        (l) => l.status === 'contacted' || l.status === 'qualified' || l.status === 'proposed',
    ).length;

    // Build pipeline counts
    const statusCounts: Record<string, number> = {};
    allLeads.forEach((l) => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'];
    const pipeline = STATUSES.map((s) => ({ status: s, count: statusCounts[s] || 0 }));

    return {
        data: {
            totalLeads: allLeads.length,
            newThisWeek,
            conversionRate,
            activeFollowUps,
            pipeline,
        },
        error: null,
    };
}

/**
 * Fetch recent activities across all leads for the home dashboard.
 */
export async function fetchRecentActivities(
    userId: string,
    isManager: boolean,
    limit = 5,
): Promise<{ data: (LeadActivity & { lead_name?: string })[]; error: string | null }> {
    let query = supabase
        .from('lead_activities')
        .select('*, leads!lead_activities_lead_id_fkey(full_name, assigned_to)')
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    type RecentActivityRow = {
        id: string;
        lead_id: string;
        user_id: string;
        type: string;
        description: string | null;
        metadata: Record<string, any> | null;
        created_at: string;
        leads: { full_name: string; assigned_to: string } | null;
    };
    const typedRecentData = (data || []) as RecentActivityRow[];

    const activities = typedRecentData.map((item) => ({
        id: item.id,
        lead_id: item.lead_id,
        user_id: item.user_id,
        type: item.type,
        description: item.description,
        metadata: item.metadata,
        created_at: item.created_at,
        lead_name: item.leads?.full_name || 'Unknown',
    }));

    // If not manager, filter to own leads
    if (!isManager) {
        const filtered = activities.filter((a) =>
            typedRecentData.find((d) => d.lead_id === a.lead_id && d.leads?.assigned_to === userId),
        );
        return { data: filtered, error: null };
    }

    return { data: activities, error: null };
}

/**
 * Manager dashboard view: count of leads by stage plus recent activity for the team.
 */
export async function getTeamLeadSummary(managerId: string): Promise<{
    data: {
        byStage: { stage: LeadStatus; count: number }[];
        recentActivity: { lead_id: string; lead_name: string; type: string; created_at: string }[];
        totalLeads: number;
    };
    error: string | null;
}> {
    const emptyResult = {
        data: { byStage: [], recentActivity: [], totalLeads: 0 },
        error: null as string | null,
    };

    try {
        const { data: agents, error: agentsError } = await supabase
            .from('users')
            .select('id')
            .eq('reports_to', managerId)
            .eq('role', 'agent')
            .eq('is_active', true);

        if (agentsError) return { ...emptyResult, error: agentsError.message };

        const agentIds = ((agents || []) as { id: string }[]).map((a) => a.id);
        if (agentIds.length === 0) return emptyResult;

        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, status, full_name')
            .in('assigned_to', agentIds);

        if (leadsError) return { ...emptyResult, error: leadsError.message };

        const allLeads = (leads || []) as { id: string; status: LeadStatus; full_name: string }[];

        const stageCounts: Record<string, number> = {};
        allLeads.forEach((l) => {
            stageCounts[l.status] = (stageCounts[l.status] || 0) + 1;
        });

        const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'];
        const byStage = STATUSES.map((s) => ({ stage: s, count: stageCounts[s] || 0 }));

        const leadIds = allLeads.map((l) => l.id);
        const leadNameMap: Record<string, string> = {};
        allLeads.forEach((l) => {
            leadNameMap[l.id] = l.full_name;
        });

        let recentActivity: { lead_id: string; lead_name: string; type: string; created_at: string }[] = [];

        if (leadIds.length > 0) {
            const { data: activities } = await supabase
                .from('lead_activities')
                .select('lead_id, type, created_at')
                .in('lead_id', leadIds)
                .order('created_at', { ascending: false })
                .limit(10);

            recentActivity = ((activities || []) as { lead_id: string; type: string; created_at: string }[]).map(
                (a) => ({
                    lead_id: a.lead_id,
                    lead_name: leadNameMap[a.lead_id] || 'Unknown',
                    type: a.type,
                    created_at: a.created_at,
                }),
            );
        }

        return {
            data: { byStage, recentActivity, totalLeads: allLeads.length },
            error: null,
        };
    } catch (err) {
        return { ...emptyResult, error: err instanceof Error ? err.message : 'Unknown error fetching team summary' };
    }
}

/**
 * Fetch extra stats for the manager dashboard (candidate count, agent count).
 */
export async function fetchManagerDashboardStats(
    userId: string,
    userRole: string,
): Promise<{ data: ManagerDashboardStats; error: string | null }> {
    let candidateQuery = supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .in('status', ['applied', 'interview_scheduled', 'interviewed', 'approved', 'exam_prep']);

    if (userRole === 'manager') {
        candidateQuery = candidateQuery.eq('assigned_manager_id', userId);
    }

    const { count: candidateCount } = await candidateQuery;

    let agentQuery = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'agent')
        .eq('is_active', true);

    if (userRole === 'manager') {
        agentQuery = agentQuery.eq('reports_to', userId);
    }

    const { count: agentCount } = await agentQuery;

    return {
        data: {
            activeCandidates: candidateCount || 0,
            agentsManaged: agentCount || 0,
        },
        error: null,
    };
}
