/**
 * Tests for lib/leads.ts — Lead & Activity service functions
 */
jest.mock('@/lib/supabase');

import { supabase } from '@/lib/supabase';

import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLeadStatus,
  fetchLeadActivities,
  addLeadNote,
  addLeadActivity,
  reassignLead,
  fetchTeamAgents,
  fetchLeadStats,
  fetchRecentActivities,
  fetchManagerDashboardStats,
} from '@/lib/leads';

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
  chain.__resolveWith(value);
}

// ── Fixtures ──

const LEAD = {
  id: 'lead-1',
  full_name: 'John Doe',
  phone: '+6591234567',
  email: 'john@example.com',
  source: 'referral',
  product_interest: 'life_insurance',
  status: 'new',
  assigned_to: 'agent-1',
  created_by: 'agent-1',
  notes: 'Initial contact',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-05T00:00:00Z',
};

const ACTIVITY = {
  id: 'act-1',
  lead_id: 'lead-1',
  user_id: 'agent-1',
  type: 'note',
  description: 'Called and left voicemail',
  metadata: {},
  created_at: '2026-03-05T10:00:00Z',
  actor: { full_name: 'Agent Alice' },
};

beforeEach(() => {
  mockSupa.__resetChains();
  jest.clearAllMocks();
});

// ── fetchLeads ──

describe('fetchLeads', () => {
  it('returns leads for agent (filtered by assigned_to)', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: [LEAD], error: null });

    const result = await fetchLeads('agent-1', false);
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('returns leads for manager (no assigned_to filter)', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: [LEAD, { ...LEAD, id: 'lead-2', assigned_to: 'agent-2' }], error: null });

    const result = await fetchLeads('mgr-1', true);
    expect(result.data).toHaveLength(2);
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: null, error: { message: 'DB error' } });

    const result = await fetchLeads('agent-1', false);
    expect(result.error).toBe('DB error');
    expect(result.data).toEqual([]);
  });
});

// ── fetchLead ──

describe('fetchLead', () => {
  it('returns single lead', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: LEAD, error: null });

    const result = await fetchLead('lead-1');
    expect(result.data?.full_name).toBe('John Doe');
    expect(result.error).toBeNull();
  });

  it('returns error when not found', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: null, error: { message: 'Not found' } });

    const result = await fetchLead('bad-id');
    expect(result.error).toBe('Not found');
  });
});

// ── createLead ──

describe('createLead', () => {
  it('creates lead and logs created activity', async () => {
    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { data: { ...LEAD, id: 'new-lead' }, error: null });

    const activitiesChain = mockSupa.__getChain('lead_activities');
    mockResolve(activitiesChain, { error: null });

    const result = await createLead(
      { full_name: 'John Doe', phone: '+65123', email: null, source: 'referral', product_interest: 'life_insurance', notes: null },
      'agent-1',
    );

    expect(result.data?.id).toBe('new-lead');
    expect(result.error).toBeNull();
    // Verify lead_activities was called
    expect(mockSupa.from).toHaveBeenCalledWith('lead_activities');
  });

  it('returns error when insert fails', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: null, error: { message: 'Duplicate phone' } });

    const result = await createLead(
      { full_name: 'John', phone: '+65123', email: null, source: 'referral', product_interest: 'life_insurance', notes: null },
      'agent-1',
    );

    expect(result.error).toBe('Duplicate phone');
    expect(result.data).toBeNull();
  });
});

// ── updateLeadStatus ──

describe('updateLeadStatus', () => {
  it('updates status and logs activity', async () => {
    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { error: null });

    const activitiesChain = mockSupa.__getChain('lead_activities');
    mockResolve(activitiesChain, { error: null });

    const result = await updateLeadStatus('lead-1', 'contacted', 'new', 'agent-1');
    expect(result.error).toBeNull();
    expect(mockSupa.from).toHaveBeenCalledWith('lead_activities');
  });

  it('returns error when update fails', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { error: { message: 'Invalid status' } });

    const result = await updateLeadStatus('lead-1', 'contacted', 'new', 'agent-1');
    expect(result.error).toBe('Invalid status');
  });
});

// ── fetchLeadActivities ──

describe('fetchLeadActivities', () => {
  it('returns activities with actor names', async () => {
    const chain = mockSupa.__getChain('lead_activities');
    mockResolve(chain, { data: [ACTIVITY], error: null });

    const result = await fetchLeadActivities('lead-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].actor_name).toBe('Agent Alice');
  });

  it('handles missing actor gracefully', async () => {
    const chain = mockSupa.__getChain('lead_activities');
    mockResolve(chain, { data: [{ ...ACTIVITY, actor: null }], error: null });

    const result = await fetchLeadActivities('lead-1');
    expect(result.data[0].actor_name).toBeUndefined();
  });
});

// ── addLeadNote ──

describe('addLeadNote', () => {
  it('bumps updated_at and inserts note activity', async () => {
    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { error: null });

    const activitiesChain = mockSupa.__getChain('lead_activities');
    mockResolve(activitiesChain, { data: { id: 'act-new', type: 'note', description: 'Test note' }, error: null });

    const result = await addLeadNote('lead-1', 'Test note', 'agent-1');
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });
});

// ── addLeadActivity ──

describe('addLeadActivity', () => {
  it('inserts generic activity and bumps updated_at', async () => {
    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { error: null });

    const activitiesChain = mockSupa.__getChain('lead_activities');
    mockResolve(activitiesChain, {
      data: { id: 'act-new', type: 'call', description: 'Discussed policy', metadata: { duration: '5min' } },
      error: null,
    });

    const result = await addLeadActivity('lead-1', 'agent-1', 'call', 'Discussed policy', { duration: '5min' });
    expect(result.error).toBeNull();
    expect(result.data?.type).toBe('call');
  });
});

// ── reassignLead ──

describe('reassignLead', () => {
  it('updates assigned_to and logs reassignment', async () => {
    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { error: null });

    const activitiesChain = mockSupa.__getChain('lead_activities');
    mockResolve(activitiesChain, { error: null });

    const result = await reassignLead(
      'lead-1', 'agent-2', 'agent-1', 'Alice', 'Bob', 'mgr-1',
    );

    expect(result.error).toBeNull();
    expect(mockSupa.from).toHaveBeenCalledWith('lead_activities');
  });

  it('returns error when update fails', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { error: { message: 'Permission denied' } });

    const result = await reassignLead('lead-1', 'agent-2', 'agent-1', 'A', 'B', 'mgr-1');
    expect(result.error).toBe('Permission denied');
  });
});

// ── fetchTeamAgents ──

describe('fetchTeamAgents', () => {
  it('returns agents reporting to manager', async () => {
    const chain = mockSupa.__getChain('users');
    mockResolve(chain, {
      data: [
        { id: 'a1', full_name: 'Agent 1' },
        { id: 'a2', full_name: 'Agent 2' },
      ],
      error: null,
    });

    const result = await fetchTeamAgents('mgr-1');
    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });
});

// ── fetchLeadStats ──

describe('fetchLeadStats', () => {
  it('computes pipeline stats correctly', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-08T12:00:00Z'));

    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, {
      data: [
        { id: '1', status: 'new', created_at: '2026-03-07T00:00:00Z' },
        { id: '2', status: 'contacted', created_at: '2026-02-01T00:00:00Z' },
        { id: '3', status: 'won', created_at: '2026-02-15T00:00:00Z' },
        { id: '4', status: 'lost', created_at: '2026-02-15T00:00:00Z' },
        { id: '5', status: 'qualified', created_at: '2026-03-01T00:00:00Z' },
      ],
      error: null,
    });

    const result = await fetchLeadStats('agent-1', false);

    expect(result.data.totalLeads).toBe(5);
    expect(result.data.newThisWeek).toBe(1); // only lead '1' is new and within 7 days
    expect(result.data.conversionRate).toBe(50); // 1 won / 2 closed (won + lost)
    expect(result.data.activeFollowUps).toBe(2); // contacted + qualified
    expect(result.data.pipeline).toHaveLength(6); // all 6 statuses
    expect(result.data.pipeline.find(p => p.status === 'new')?.count).toBe(1);
    expect(result.data.pipeline.find(p => p.status === 'proposed')?.count).toBe(0);

    jest.useRealTimers();
  });

  it('returns zeros when no leads', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: [], error: null });

    const result = await fetchLeadStats('agent-1', false);
    expect(result.data.totalLeads).toBe(0);
    expect(result.data.conversionRate).toBe(0);
    expect(result.data.activeFollowUps).toBe(0);
  });

  it('returns error with zeroed stats on failure', async () => {
    const chain = mockSupa.__getChain('leads');
    mockResolve(chain, { data: null, error: { message: 'Timeout' } });

    const result = await fetchLeadStats('agent-1', false);
    expect(result.error).toBe('Timeout');
    expect(result.data.totalLeads).toBe(0);
  });
});

// ── fetchRecentActivities ──

describe('fetchRecentActivities', () => {
  it('returns activities with lead names for manager', async () => {
    const chain = mockSupa.__getChain('lead_activities');
    mockResolve(chain, {
      data: [
        {
          id: 'act-1', lead_id: 'lead-1', user_id: 'agent-1',
          type: 'note', description: 'Test', metadata: {},
          created_at: '2026-03-08T10:00:00Z',
          leads: { full_name: 'John Doe', assigned_to: 'agent-1' },
        },
      ],
      error: null,
    });

    const result = await fetchRecentActivities('mgr-1', true, 5);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].lead_name).toBe('John Doe');
  });

  it('filters to own leads for agent', async () => {
    const chain = mockSupa.__getChain('lead_activities');
    mockResolve(chain, {
      data: [
        { id: 'a1', lead_id: 'l1', user_id: 'agent-1', type: 'note', description: '', metadata: {}, created_at: '2026-03-08T10:00:00Z', leads: { full_name: 'Mine', assigned_to: 'agent-1' } },
        { id: 'a2', lead_id: 'l2', user_id: 'agent-2', type: 'note', description: '', metadata: {}, created_at: '2026-03-08T09:00:00Z', leads: { full_name: 'Theirs', assigned_to: 'agent-2' } },
      ],
      error: null,
    });

    const result = await fetchRecentActivities('agent-1', false, 5);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].lead_name).toBe('Mine');
  });
});

// ── fetchManagerDashboardStats ──

describe('fetchManagerDashboardStats', () => {
  it('returns candidate and agent counts', async () => {
    const candidatesChain = mockSupa.__getChain('candidates');
    mockResolve(candidatesChain, { count: 12 });

    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { count: 5 });

    const result = await fetchManagerDashboardStats('mgr-1', 'manager');
    expect(result.data.activeCandidates).toBe(12);
    expect(result.data.agentsManaged).toBe(5);
  });

  it('defaults to 0 when counts are null', async () => {
    const candidatesChain = mockSupa.__getChain('candidates');
    mockResolve(candidatesChain, { count: null });

    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { count: null });

    const result = await fetchManagerDashboardStats('dir-1', 'director');
    expect(result.data.activeCandidates).toBe(0);
    expect(result.data.agentsManaged).toBe(0);
  });
});
