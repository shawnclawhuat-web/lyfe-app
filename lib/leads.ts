/**
 * Leads service — Supabase CRUD operations for leads & activities
 */
import type { Lead, LeadActivity, LeadActivityType, LeadSource, LeadStatus, ProductInterest } from '@/types/lead';
import { supabase } from './supabase';

// ── Leads ────────────────────────────────────────────────────

export interface CreateLeadInput {
    full_name: string;
    phone: string | null;
    email: string | null;
    source: LeadSource;
    product_interest: ProductInterest;
    notes: string | null;
}

/**
 * Fetch leads for a user. In manager mode, fetches team leads via the
 * `get_team_member_ids()` Postgres function (handled by RLS).
 * In agent mode, fetches only leads assigned to the current user.
 */
export async function fetchLeads(
    userId: string,
    isManager: boolean,
    page?: number,
    pageSize: number = 50,
): Promise<{ data: Lead[]; error: string | null; hasMore: boolean }> {
    let query = supabase.from('leads').select('*').order('updated_at', { ascending: false });

    if (!isManager) {
        query = query.eq('assigned_to', userId);
    }

    if (page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize;
        query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message, hasMore: false };

    const results = (data || []) as Lead[];

    if (page !== undefined) {
        const hasMore = results.length > pageSize;
        return { data: hasMore ? results.slice(0, pageSize) : results, error: null, hasMore };
    }

    return { data: results, error: null, hasMore: false };
}

/**
 * Fetch a single lead by ID.
 */
export async function fetchLead(leadId: string): Promise<{ data: Lead | null; error: string | null }> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

    if (error) return { data: null, error: error.message };
    return { data: data as Lead, error: null };
}

/**
 * Create a new lead + an initial "created" activity.
 */
export async function createLead(
    input: CreateLeadInput,
    userId: string,
): Promise<{ data: Lead | null; error: string | null }> {
    // Insert the lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            full_name: input.full_name,
            phone: input.phone || null,
            email: input.email || null,
            source: input.source,
            product_interest: input.product_interest,
            notes: input.notes || null,
            status: 'new' as LeadStatus,
            assigned_to: userId,
            created_by: userId,
        })
        .select()
        .single();

    if (leadError) return { data: null, error: leadError.message };

    // Insert "created" activity
    await supabase.from('lead_activities').insert({
        lead_id: lead.id,
        user_id: userId,
        type: 'created' as LeadActivityType,
        description: `Lead created from ${input.source}`,
        metadata: {},
    });

    return { data: lead as Lead, error: null };
}

/**
 * Update a lead's status and create a status_change activity.
 */
export async function updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    oldStatus: LeadStatus,
    userId: string,
): Promise<{ error: string | null }> {
    const { error: updateError } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

    if (updateError) return { error: updateError.message };

    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: userId,
        type: 'status_change' as LeadActivityType,
        description: null,
        metadata: { from_status: oldStatus, to_status: newStatus },
    });

    return { error: null };
}

// ── Activities ───────────────────────────────────────────────

/**
 * Fetch activities for a single lead.
 */
export async function fetchLeadActivities(
    leadId: string,
    page?: number,
    pageSize: number = 20,
): Promise<{ data: LeadActivity[]; error: string | null; hasMore: boolean }> {
    let query = supabase
        .from('lead_activities')
        .select('*, actor:users!lead_activities_user_id_fkey(full_name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (page !== undefined) {
        const from = page * pageSize;
        const to = from + pageSize;
        query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message, hasMore: false };

    const typedData = (data || []) as {
        id: string;
        lead_id: string;
        user_id: string;
        type: string;
        description: string | null;
        metadata: Record<string, any> | null;
        created_at: string;
        actor: { full_name: string } | null;
    }[];

    const activities: LeadActivity[] = typedData.map((item) => ({
        id: item.id,
        lead_id: item.lead_id,
        user_id: item.user_id,
        type: item.type,
        description: item.description,
        metadata: item.metadata,
        created_at: item.created_at,
        actor_name: item.actor?.full_name || undefined,
    })) as LeadActivity[];

    if (page !== undefined) {
        const hasMore = activities.length > pageSize;
        return { data: hasMore ? activities.slice(0, pageSize) : activities, error: null, hasMore };
    }

    return { data: activities, error: null, hasMore: false };
}

/**
 * Add a note activity to a lead.
 */
export async function addLeadNote(
    leadId: string,
    note: string,
    userId: string,
): Promise<{ data: LeadActivity | null; error: string | null }> {
    // Update lead's updated_at timestamp
    await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);

    const { data, error } = await supabase
        .from('lead_activities')
        .insert({
            lead_id: leadId,
            user_id: userId,
            type: 'note' as LeadActivityType,
            description: note,
            metadata: {},
        })
        .select()
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as LeadActivity, error: null };
}

/**
 * Log a generic activity against a lead (call, whatsapp, reassignment, etc.)
 * Also bumps the lead's updated_at timestamp.
 */
export async function addLeadActivity(
    leadId: string,
    userId: string,
    type: LeadActivityType,
    description: string | null,
    metadata: Record<string, any> = {},
): Promise<{ data: LeadActivity | null; error: string | null }> {
    await supabase.from('leads').update({ updated_at: new Date().toISOString() }).eq('id', leadId);

    const { data, error } = await supabase
        .from('lead_activities')
        .insert({ lead_id: leadId, user_id: userId, type, description, metadata })
        .select()
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as LeadActivity, error: null };
}

/**
 * Reassign a lead to a new agent and log a reassignment activity.
 */
export async function reassignLead(
    leadId: string,
    toAgentId: string,
    fromAgentId: string,
    fromAgentName: string,
    toAgentName: string,
    actingUserId: string,
): Promise<{ error: string | null }> {
    const { error: updateError } = await supabase
        .from('leads')
        .update({ assigned_to: toAgentId, updated_at: new Date().toISOString() })
        .eq('id', leadId);

    if (updateError) return { error: updateError.message };

    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: actingUserId,
        type: 'reassignment' as LeadActivityType,
        description: null,
        metadata: {
            from_agent_id: fromAgentId,
            to_agent_id: toAgentId,
            from_agent_name: fromAgentName,
            to_agent_name: toAgentName,
        },
    });

    return { error: null };
}

/**
 * Fetch agents reporting to a manager (for the reassign picker).
 */
export async function fetchTeamAgents(
    managerId: string,
): Promise<{ data: { id: string; full_name: string }[]; error: string | null }> {
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('reports_to', managerId)
        .eq('role', 'agent')
        .eq('is_active', true);

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as { id: string; full_name: string }[], error: null };
}

// ── Dashboard Stats ──────────────────────────────────────────

export interface LeadPipelineStats {
    totalLeads: number;
    newThisWeek: number;
    conversionRate: number;
    activeFollowUps: number;
    pipeline: { status: LeadStatus; count: number }[];
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
    // Fetch activities with join to leads for the lead name
    let query = supabase
        .from('lead_activities')
        .select('*, leads!lead_activities_lead_id_fkey(full_name, assigned_to)')
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    // Flatten the lead name into the activity
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

// ── Manager Dashboard Stats ──────────────────────────────────

export interface ManagerDashboardStats {
    activeCandidates: number;
    agentsManaged: number;
}

// ── Agent / Manager Workflow Functions ────────────────────────

/**
 * Assign a lead to a specific agent. Used by managers to distribute leads.
 * Logs a reassignment activity when the lead was previously assigned to someone else.
 */
export async function assignLead(
    leadId: string,
    agentId: string,
    actingUserId: string,
): Promise<{ error: string | null }> {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('leads')
            .select('assigned_to')
            .eq('id', leadId)
            .single();

        if (fetchError) return { error: fetchError.message };

        const { error: updateError } = await supabase
            .from('leads')
            .update({ assigned_to: agentId, updated_at: new Date().toISOString() })
            .eq('id', leadId);

        if (updateError) return { error: updateError.message };

        const previousAgent = (existing as { assigned_to: string | null })?.assigned_to;
        await supabase.from('lead_activities').insert({
            lead_id: leadId,
            user_id: actingUserId,
            type: 'reassignment' as LeadActivityType,
            description: previousAgent ? 'Lead reassigned by manager' : 'Lead assigned by manager',
            metadata: {
                from_agent_id: previousAgent || null,
                to_agent_id: agentId,
            },
        });

        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error assigning lead' };
    }
}

/**
 * Get all leads assigned to a specific agent, ordered by most recently updated.
 */
export async function getLeadsByAgent(
    agentId: string,
): Promise<{ data: Lead[]; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_to', agentId)
            .order('updated_at', { ascending: false });

        if (error) return { data: [], error: error.message };
        return { data: (data || []) as Lead[], error: null };
    } catch (err) {
        return { data: [], error: err instanceof Error ? err.message : 'Unknown error fetching leads' };
    }
}

/**
 * Update a lead's status to progress it through the pipeline.
 * Logs a status_change activity with from/to metadata.
 */
export async function updateLeadStage(
    leadId: string,
    newStage: LeadStatus,
    userId: string,
): Promise<{ error: string | null }> {
    try {
        // Fetch current status for the activity log
        const { data: existing, error: fetchError } = await supabase
            .from('leads')
            .select('status')
            .eq('id', leadId)
            .single();

        if (fetchError) return { error: fetchError.message };

        const oldStage = (existing as { status: LeadStatus }).status;

        const { error: updateError } = await supabase
            .from('leads')
            .update({ status: newStage, updated_at: new Date().toISOString() })
            .eq('id', leadId);

        if (updateError) return { error: updateError.message };

        await supabase.from('lead_activities').insert({
            lead_id: leadId,
            user_id: userId,
            type: 'status_change' as LeadActivityType,
            description: `Stage updated from ${oldStage} to ${newStage}`,
            metadata: { from_status: oldStage, to_status: newStage },
        });

        return { error: null };
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Unknown error updating lead stage' };
    }
}

/**
 * Manager dashboard view: count of leads by stage plus recent activity for the team.
 */
export async function getTeamLeadSummary(
    managerId: string,
): Promise<{
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
        // Get team agent IDs
        const { data: agents, error: agentsError } = await supabase
            .from('users')
            .select('id')
            .eq('reports_to', managerId)
            .eq('role', 'agent')
            .eq('is_active', true);

        if (agentsError) return { ...emptyResult, error: agentsError.message };

        const agentIds = ((agents || []) as { id: string }[]).map((a) => a.id);
        if (agentIds.length === 0) return emptyResult;

        // Fetch all team leads
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, status, full_name')
            .in('assigned_to', agentIds);

        if (leadsError) return { ...emptyResult, error: leadsError.message };

        const allLeads = (leads || []) as { id: string; status: LeadStatus; full_name: string }[];

        // Count by stage
        const stageCounts: Record<string, number> = {};
        allLeads.forEach((l) => {
            stageCounts[l.status] = (stageCounts[l.status] || 0) + 1;
        });

        const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'];
        const byStage = STATUSES.map((s) => ({ stage: s, count: stageCounts[s] || 0 }));

        // Fetch recent activities for team leads
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
    // Count active candidates (not yet active_agent or licensed)
    let candidateQuery = supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })
        .in('status', ['applied', 'interview_scheduled', 'interviewed', 'approved', 'exam_prep']);

    if (userRole === 'manager') {
        candidateQuery = candidateQuery.eq('assigned_manager_id', userId);
    }

    const { count: candidateCount } = await candidateQuery;

    // Count agents
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
