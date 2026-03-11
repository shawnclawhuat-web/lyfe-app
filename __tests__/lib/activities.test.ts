/**
 * Tests for lib/activities.ts — Activity tracking service functions
 */
import { supabase } from '@/lib/supabase';

import { getAgentActivitySummary } from '@/lib/activities';

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

// ── getAgentActivitySummary ──

describe('getAgentActivitySummary', () => {
    it('returns activity counts grouped by type', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, {
            data: [{ type: 'call' }, { type: 'call' }, { type: 'meeting' }, { type: 'note' }, { type: 'call' }],
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

    it('returns error when date range is invalid (start > end)', async () => {
        const dateRange = { start: '2026-03-10', end: '2026-03-01' };
        const result = await getAgentActivitySummary('agent-1', dateRange);

        expect(result.error).toBe('Invalid date range: start must be before or equal to end');
        expect(result.data.totalActivities).toBe(0);
    });

    it('accepts same start and end date', async () => {
        const chain = mockSupa.__getChain('lead_activities');
        mockResolve(chain, { data: [{ type: 'call' }], error: null });

        const dateRange = { start: '2026-03-05', end: '2026-03-05' };
        const result = await getAgentActivitySummary('agent-1', dateRange);

        expect(result.error).toBeNull();
        expect(result.data.totalActivities).toBe(1);
    });
});
