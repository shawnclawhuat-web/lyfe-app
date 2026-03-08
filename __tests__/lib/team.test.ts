/**
 * Tests for lib/team.ts — Team member service functions
 */
jest.mock('@/lib/supabase');

import { supabase } from '@/lib/supabase';

import { fetchTeamMembers, fetchTeamMember } from '@/lib/team';

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
  chain.__resolveWith(value);
}

// ── Fixtures ──

const USER_AGENT = {
  id: 'agent-1',
  full_name: 'Agent Alice',
  role: 'agent',
  phone: '+6591111111',
  email: 'alice@example.com',
  avatar_url: 'https://avatar.com/alice.jpg',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const USER_AGENT_2 = {
  id: 'agent-2',
  full_name: 'Agent Bob',
  role: 'agent',
  phone: '+6592222222',
  email: null,
  avatar_url: null,
  is_active: true,
  created_at: '2026-02-01T00:00:00Z',
};

beforeEach(() => {
  mockSupa.__resetChains();
  jest.clearAllMocks();
});

// ── fetchTeamMembers ──

describe('fetchTeamMembers', () => {
  it('returns members with aggregated lead stats', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: [USER_AGENT, USER_AGENT_2], error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, {
      data: [
        { assigned_to: 'agent-1', status: 'won' },
        { assigned_to: 'agent-1', status: 'new' },
        { assigned_to: 'agent-1', status: 'lost' },
        { assigned_to: 'agent-2', status: 'new' },
      ],
      error: null,
    });

    const result = await fetchTeamMembers('mgr-1', 'manager');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    const alice = result.data.find(m => m.id === 'agent-1')!;
    expect(alice.name).toBe('Agent Alice');
    expect(alice.leadsCount).toBe(3);
    expect(alice.wonCount).toBe(1);
    expect(alice.conversionRate).toBe(33); // Math.round(1/3 * 100)

    const bob = result.data.find(m => m.id === 'agent-2')!;
    expect(bob.leadsCount).toBe(1);
    expect(bob.wonCount).toBe(0);
    expect(bob.conversionRate).toBe(0);
  });

  it('returns empty when no users found', async () => {
    const chain = mockSupa.__getChain('users');
    mockResolve(chain, { data: [], error: null });

    const result = await fetchTeamMembers('mgr-1', 'manager');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns error on query failure', async () => {
    const chain = mockSupa.__getChain('users');
    mockResolve(chain, { data: null, error: { message: 'DB error' } });

    const result = await fetchTeamMembers('mgr-1', 'manager');
    expect(result.error).toBe('DB error');
    expect(result.data).toEqual([]);
  });

  it('handles members with no leads', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: [USER_AGENT], error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { data: [], error: null });

    const result = await fetchTeamMembers('mgr-1', 'director');
    expect(result.data[0].leadsCount).toBe(0);
    expect(result.data[0].conversionRate).toBe(0);
  });

  it('defaults is_active to true when null', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: [{ ...USER_AGENT, is_active: null }], error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { data: [], error: null });

    const result = await fetchTeamMembers('mgr-1', 'manager');
    expect(result.data[0].isActive).toBe(true);
  });
});

// ── fetchTeamMember ──

describe('fetchTeamMember', () => {
  it('returns member with leads and computed stats', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: USER_AGENT, error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, {
      data: [
        { id: 'l1', status: 'won', assigned_to: 'agent-1', full_name: 'Lead 1', updated_at: '2026-03-05' },
        { id: 'l2', status: 'new', assigned_to: 'agent-1', full_name: 'Lead 2', updated_at: '2026-03-01' },
      ],
      error: null,
    });

    const result = await fetchTeamMember('agent-1');
    expect(result.error).toBeNull();
    expect(result.member?.name).toBe('Agent Alice');
    expect(result.member?.leadsCount).toBe(2);
    expect(result.member?.wonCount).toBe(1);
    expect(result.member?.conversionRate).toBe(50); // 1/2 * 100
    expect(result.leads).toHaveLength(2);
  });

  it('returns error when user not found', async () => {
    const chain = mockSupa.__getChain('users');
    mockResolve(chain, { data: null, error: { message: 'Not found' } });

    const result = await fetchTeamMember('bad-id');
    expect(result.error).toBe('Not found');
    expect(result.member).toBeNull();
    expect(result.leads).toEqual([]);
  });

  it('returns error when leads query fails', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: USER_AGENT, error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { data: null, error: { message: 'Leads error' } });

    const result = await fetchTeamMember('agent-1');
    expect(result.error).toBe('Leads error');
  });

  it('handles zero leads correctly', async () => {
    const usersChain = mockSupa.__getChain('users');
    mockResolve(usersChain, { data: USER_AGENT, error: null });

    const leadsChain = mockSupa.__getChain('leads');
    mockResolve(leadsChain, { data: [], error: null });

    const result = await fetchTeamMember('agent-1');
    expect(result.member?.leadsCount).toBe(0);
    expect(result.member?.conversionRate).toBe(0);
    expect(result.leads).toEqual([]);
  });
});
