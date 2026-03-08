/**
 * Tests for lib/events.ts — Event & Roadshow service functions
 */
jest.mock('@/lib/supabase');

import { supabase } from '@/lib/supabase';
import {
  fetchEvents,
  fetchAllEvents,
  fetchUpcomingEvents,
  fetchEventById,
  createEvent,
  fetchAllUsers,
  hasUserCheckedIn,
  fetchRoadshowConfig,
  saveRoadshowConfig,
  fetchRoadshowAttendance,
  logRoadshowAttendanceWithPledge,
  managerCheckIn,
  fetchRoadshowActivities,
  logRoadshowActivity,
  createRoadshowBulk,
  deleteEvent,
  updateEvent,
} from '@/lib/events';

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
  chain.__resolveWith(value);
}

// ── Fixtures ──

const EVENT_ROW = {
  id: 'evt-1',
  title: 'Team Standup',
  description: 'Weekly sync',
  event_type: 'team_meeting',
  event_date: '2026-03-15',
  start_time: '09:00',
  end_time: '10:00',
  location: 'Office',
  created_by: 'user-1',
  creator_user: { full_name: 'Alice Tan' },
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  external_attendees: [],
  event_attendees: [
    {
      id: 'att-1',
      event_id: 'evt-1',
      user_id: 'user-2',
      attendee_role: 'attendee',
      users: { full_name: 'Bob Lim', avatar_url: null },
    },
  ],
};

beforeEach(() => {
  mockSupa.__resetChains();
  jest.clearAllMocks();
});

// ── fetchEvents ──

describe('fetchEvents', () => {
  it('returns empty array when no event IDs found', async () => {
    const attendeeChain = mockSupa.__getChain('event_attendees');
    mockResolve(attendeeChain, { data: [], error: null });

    const eventsChain = mockSupa.__getChain('events');
    mockResolve(eventsChain, { data: [], error: null });

    const result = await fetchEvents('user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns error when attendee query fails', async () => {
    const attendeeChain = mockSupa.__getChain('event_attendees');
    mockResolve(attendeeChain, { data: null, error: { message: 'Network error' } });

    const result = await fetchEvents('user-1');
    expect(result.error).toBe('Network error');
    expect(result.data).toEqual([]);
  });
});

// ── fetchAllEvents ──

describe('fetchAllEvents', () => {
  it('returns mapped events on success', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { data: [EVENT_ROW], error: null });

    const result = await fetchAllEvents();
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Team Standup');
    expect(result.data[0].creator_name).toBe('Alice Tan');
    expect(result.data[0].attendees[0].full_name).toBe('Bob Lim');
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { data: null, error: { message: 'DB timeout' } });

    const result = await fetchAllEvents();
    expect(result.error).toBe('DB timeout');
    expect(result.data).toEqual([]);
  });

  it('handles null data gracefully', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { data: null, error: null });

    const result = await fetchAllEvents();
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });
});

// ── fetchEventById ──

describe('fetchEventById', () => {
  it('returns mapped single event', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { data: EVENT_ROW, error: null });

    const result = await fetchEventById('evt-1');
    expect(result.error).toBeNull();
    expect(result.data?.id).toBe('evt-1');
    expect(result.data?.attendees).toHaveLength(1);
  });

  it('returns error when not found', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { data: null, error: { message: 'Not found' } });

    const result = await fetchEventById('bad-id');
    expect(result.error).toBe('Not found');
    expect(result.data).toBeNull();
  });
});

// ── fetchAllUsers ──

describe('fetchAllUsers', () => {
  it('returns non-admin users sorted by name', async () => {
    const chain = mockSupa.__getChain('users');
    mockResolve(chain, {
      data: [
        { id: 'u1', full_name: 'Alice', role: 'agent', avatar_url: null },
        { id: 'u2', full_name: 'Bob', role: 'manager', avatar_url: 'url' },
      ],
      error: null,
    });

    const result = await fetchAllUsers();
    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });
});

// ── hasUserCheckedIn ──

describe('hasUserCheckedIn', () => {
  it('returns true when attendance exists', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, { data: { id: 'att-1' }, error: null });

    const result = await hasUserCheckedIn('evt-1', 'user-1');
    expect(result).toBe(true);
  });

  it('returns false when no attendance', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, { data: null, error: null });

    const result = await hasUserCheckedIn('evt-1', 'user-1');
    expect(result).toBe(false);
  });
});

// ── fetchRoadshowConfig ──

describe('fetchRoadshowConfig', () => {
  it('returns config with computed costs', async () => {
    const chain = mockSupa.__getChain('roadshow_configs');
    mockResolve(chain, {
      data: {
        id: 'cfg-1', event_id: 'evt-1', weekly_cost: 700, slots_per_day: 2,
        expected_start_time: '09:00:00', late_grace_minutes: 15,
        suggested_sitdowns: 5, suggested_pitches: 3, suggested_closed: 1,
      },
      error: null,
    });

    const result = await fetchRoadshowConfig('evt-1');
    expect(result.error).toBeNull();
    expect(result.data!.daily_cost).toBe(100);
    expect(result.data!.slot_cost).toBe(50);
    expect(result.data!.expected_start_time).toBe('09:00');
  });

  it('returns null when no config (PGRST116)', async () => {
    const chain = mockSupa.__getChain('roadshow_configs');
    mockResolve(chain, { data: null, error: { code: 'PGRST116', message: 'No rows' } });

    const result = await fetchRoadshowConfig('evt-1');
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('returns error for non-PGRST116 errors', async () => {
    const chain = mockSupa.__getChain('roadshow_configs');
    mockResolve(chain, { data: null, error: { code: 'OTHER', message: 'Server error' } });

    const result = await fetchRoadshowConfig('evt-1');
    expect(result.error).toBe('Server error');
  });
});

// ── saveRoadshowConfig ──

describe('saveRoadshowConfig', () => {
  it('upserts config successfully', async () => {
    const chain = mockSupa.__getChain('roadshow_configs');
    mockResolve(chain, { error: null });

    const result = await saveRoadshowConfig('evt-1', {
      weekly_cost: 700, slots_per_day: 2, expected_start_time: '09:00',
      late_grace_minutes: 15, suggested_sitdowns: 5, suggested_pitches: 3, suggested_closed: 1,
    });
    expect(result.error).toBeNull();
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('roadshow_configs');
    mockResolve(chain, { error: { message: 'Upsert failed' } });

    const result = await saveRoadshowConfig('evt-1', {
      weekly_cost: 700, slots_per_day: 2, expected_start_time: '09:00',
      late_grace_minutes: 15, suggested_sitdowns: 5, suggested_pitches: 3, suggested_closed: 1,
    });
    expect(result.error).toBe('Upsert failed');
  });
});

// ── fetchRoadshowAttendance ──

describe('fetchRoadshowAttendance', () => {
  it('returns attendance rows', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, {
      data: [{
        id: 'att-1', event_id: 'evt-1', user_id: 'u1',
        checked_in_at: '2026-03-15T09:30:00Z', late_reason: null, checked_in_by: null,
        pledged_sitdowns: 5, pledged_pitches: 3, pledged_closed: 1, pledged_afyc: 1000,
        users: { full_name: 'Charlie' },
      }],
      error: null,
    });

    const result = await fetchRoadshowAttendance('evt-1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].full_name).toBe('Charlie');
    expect(result.data[0].pledged_sitdowns).toBe(5);
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, { data: null, error: { message: 'Query failed' } });

    const result = await fetchRoadshowAttendance('evt-1');
    expect(result.error).toBe('Query failed');
    expect(result.data).toEqual([]);
  });
});

// ── logRoadshowAttendanceWithPledge ──

describe('logRoadshowAttendanceWithPledge', () => {
  it('inserts attendance with pledges', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, { error: null });

    const result = await logRoadshowAttendanceWithPledge(
      'evt-1', 'user-1', null, { sitdowns: 5, pitches: 3, closed: 1, afyc: 1000 },
    );
    expect(result.error).toBeNull();
  });
});

// ── managerCheckIn ──

describe('managerCheckIn', () => {
  it('inserts attendance with manager context', async () => {
    const chain = mockSupa.__getChain('roadshow_attendance');
    mockResolve(chain, { error: null });

    const result = await managerCheckIn(
      'evt-1', 'agent-1', '2026-03-15T09:30:00Z', null,
      { sitdowns: 5, pitches: 3, closed: 1, afyc: 500 }, 'manager-1',
    );
    expect(result.error).toBeNull();
  });
});

// ── fetchRoadshowActivities ──

describe('fetchRoadshowActivities', () => {
  it('returns mapped activities', async () => {
    const chain = mockSupa.__getChain('roadshow_activities');
    mockResolve(chain, {
      data: [{
        id: 'act-1', event_id: 'evt-1', user_id: 'u1',
        type: 'sitdown', afyc_amount: null, logged_at: '2026-03-15T10:00:00Z',
        users: { full_name: 'Diana' },
      }],
      error: null,
    });

    const result = await fetchRoadshowActivities('evt-1');
    expect(result.error).toBeNull();
    expect(result.data[0].type).toBe('sitdown');
    expect(result.data[0].full_name).toBe('Diana');
  });

  it('defaults full_name to Unknown', async () => {
    const chain = mockSupa.__getChain('roadshow_activities');
    mockResolve(chain, {
      data: [{ id: 'act-1', event_id: 'evt-1', user_id: 'u1', type: 'pitch', afyc_amount: null, logged_at: '2026-03-15T10:00:00Z', users: null }],
      error: null,
    });

    const result = await fetchRoadshowActivities('evt-1');
    expect(result.data[0].full_name).toBe('Unknown');
  });
});

// ── logRoadshowActivity ──

describe('logRoadshowActivity', () => {
  it('inserts and returns activity', async () => {
    const chain = mockSupa.__getChain('roadshow_activities');
    mockResolve(chain, {
      data: { id: 'act-1', event_id: 'evt-1', user_id: 'u1', type: 'case_closed', afyc_amount: 5000, logged_at: '2026-03-15T10:00:00Z' },
      error: null,
    });

    const result = await logRoadshowActivity('evt-1', 'u1', 'case_closed', 5000);
    expect(result.error).toBeNull();
    expect(result.data?.type).toBe('case_closed');
    expect(result.data?.afyc_amount).toBe(5000);
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('roadshow_activities');
    mockResolve(chain, { data: null, error: { message: 'Insert failed' } });

    const result = await logRoadshowActivity('evt-1', 'u1', 'sitdown');
    expect(result.error).toBe('Insert failed');
    expect(result.data).toBeNull();
  });
});

// ── createRoadshowBulk ──

describe('createRoadshowBulk', () => {
  it('calls RPC and returns result', async () => {
    mockSupa.rpc.mockResolvedValue({ data: { event_ids: ['evt-1', 'evt-2'], count: 2 }, error: null });

    const result = await createRoadshowBulk(
      [{ title: 'RS1', event_date: '2026-03-15', start_time: '09:00', end_time: '17:00', location: 'Mall' }],
      { weekly_cost: 700, slots_per_day: 2, expected_start_time: '09:00', late_grace_minutes: 15, suggested_sitdowns: 5, suggested_pitches: 3, suggested_closed: 1 },
      [{ user_id: 'u1', attendee_role: 'attendee' }],
      'mgr-1',
    );

    expect(result.error).toBeNull();
    expect(result.data?.count).toBe(2);
    expect(mockSupa.rpc).toHaveBeenCalledWith('create_roadshow_bulk', expect.objectContaining({ p_created_by: 'mgr-1' }));
  });

  it('returns error on RPC failure', async () => {
    mockSupa.rpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });
    const result = await createRoadshowBulk([], {} as any, [], 'mgr-1');
    expect(result.error).toBe('RPC error');
  });
});

// ── deleteEvent ──

describe('deleteEvent', () => {
  it('deletes successfully', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { error: null });

    const result = await deleteEvent('evt-1');
    expect(result.error).toBeNull();
  });

  it('returns error on failure', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { error: { message: 'FK violation' } });

    const result = await deleteEvent('evt-1');
    expect(result.error).toBe('FK violation');
  });
});

// ── updateEvent ──

describe('updateEvent', () => {
  it('returns error when event update fails', async () => {
    const chain = mockSupa.__getChain('events');
    mockResolve(chain, { error: { message: 'Update failed' } });

    const result = await updateEvent('evt-1', {
      title: 'Updated', description: '', event_type: 'team_meeting',
      event_date: '2026-03-15', start_time: '10:00', end_time: '11:00',
      location: 'Office', attendees: [], external_attendees: [],
    });

    expect(result.error).toBe('Update failed');
    expect(result.data).toBeNull();
  });
});
