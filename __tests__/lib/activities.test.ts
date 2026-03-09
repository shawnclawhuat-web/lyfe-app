/**
 * Tests for lib/activities.ts — Activity tracking service functions
 */
import { supabase } from '@/lib/supabase';

import { logActivity, getActivitiesByLead, getAgentActivitySummary } from '@/lib/activities';

jest.mock('@/lib/supabase');

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
    chain.__resolveWith(value);
}

// ── Fixtures ──

const ACTIVITY = {
    id: 'act-1',
    lead_id: 'lead-1',
    user_id: 'agent-1',
    type: 'call',
    description: 'Discussed policy options',
    metadata: { duration: '10min' },
    created_at: '2026-03-05T10:00:00Z',
};

beforeEach(() => {
    mockSupa.__resetChains();
    jest.clearAllMocks();
});

// ── logActivity ──

describe('logActivity', () => {
    it('logs activity and bumps lead updated_at', async () => {
        const leadsChain = mockSupa.__getChain('leads');
        mockResolve(leadsChain, { error: null });

        const activitiesChain = mockSupa.__getChain('lead_activities');
        mockResolve(activitiesChain, { data: ACTIVITY, error: null });

        const result = await logActivity('lead-1', 'call', 'Discussed policy options', 'agent-1', {
            duration: '10min',
        });

        expect(result.error).toBeNull();
        expect(result.data).toBeTruthy();
        expect(result.data?.type).toBe('call');
        expect(mockSupa.from).toHaveBeenCalledWith('leads');
        expect(mockSupa.from).toHaveBeenCalledWith('lead_activities');
    });

    it('returns error when insert fails', async () => {
        const leadsChain = mockSupa.__getChain('leads');
        mockResolve(leadsChain, { error: null });

        const activitiesChain = mockSupa.__getChain('lead_activities');
        mockResolve(activitiesChain, { data: null, error: { message: 'Insert failed' } });

        const result = await logActivity('lead-1', 'call', null, 'agent-1');

        expect(result.error).toBe('Insert failed');
        expect(result.data).toBeNull();
    });

    it('works with null note and empty metadata', async () => {
        const leadsChain = mockSupa.__getChain('leads');
        mockResolve(leadsChain, { error: null });

        const activitiesChain = mockSupa.__getChain('lead_activities');
        mockResolve(activitiesChain, {
            data: { ...ACTIVITY, description: null, metadata: {} },
            error: null,
        });

        const result = await logActivity('lead-1', 'follow_up', null, 'agent-1');

        expect(result.error).toBeNull();
        expect(result.data).toBeTruthy();
    });
});

// ── getActivitiesByLead ──

describe('getActivitiesByLead', () => {
    it('returns activities for a lead', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: [ACTIVITY, { ...ACTIVITY, id: 'act-2', type: 'note' }], error: null });

        const result = await getActivitiesByLead('lead-1');

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
    });

    it('returns empty array when no activities', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: [], error: null });

        const result = await getActivitiesByLead('lead-1');

        expect(result.error).toBeNull();
        expect(result.data).toEqual([]);
    });

    it('returns error on failure', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: null, error: { message: 'Query failed' } });

        const result = await getActivitiesByLead('lead-1');

        expect(result.error).toBe('Query failed');
        expect(result.data).toEqual([]);
    });
});

// ── getAgentActivitySummary ──

describe('getAgentActivitySummary', () => {
    it('returns activity counts grouped by type', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, {
            data: [
                { type: 'call' },
                { type: 'call' },
                { type: 'meeting' },
                { type: 'note' },
                { type: 'call' },
            ],
            error: null,
        });

        const dateRange = { start: '2026-03-01', end: '2026-03-08' };
        const result = await getAgentActivitySummary('agent-1', dateRange);

        expect(result.error).toBeNull();
        expect(result.data.totalActivities).toBe(5);
        expect(result.data.agentId).toBe('agent-1');
        expect(result.data.dateRange).toEqual(dateRange);

        const callCount = result.data.byType.find((t) => t.type === 'call');
        expect(callCount?.count).toBe(3);

        const meetingCount = result.data.byType.find((t) => t.type === 'meeting');
        expect(meetingCount?.count).toBe(1);
    });

    it('returns empty summary when no activities', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: [], error: null });

        const dateRange = { start: '2026-03-01', end: '2026-03-08' };
        const result = await getAgentActivitySummary('agent-1', dateRange);

        expect(result.error).toBeNull();
        expect(result.data.totalActivities).toBe(0);
        expect(result.data.byType).toEqual([]);
    });

    it('returns error on failure', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: null, error: { message: 'Timeout' } });

        const dateRange = { start: '2026-03-01', end: '2026-03-08' };
        const result = await getAgentActivitySummary('agent-1', dateRange);

        expect(result.error).toBe('Timeout');
        expect(result.data.totalActivities).toBe(0);
    });
});
