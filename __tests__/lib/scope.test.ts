import { supabase } from '@/lib/supabase';
import { getDirectReports } from '@/lib/scope';

jest.mock('@/lib/supabase');

const mockSupa = supabase as any;

function mockResolve(chain: any, value: any) {
    chain.__resolveWith(value);
}

beforeEach(() => {
    mockSupa.__resetChains();
    jest.clearAllMocks();
});

describe('getDirectReports', () => {
    it('returns direct reports with names', async () => {
        const chain = mockSupa.__getChain('users');
        mockResolve(chain, {
            data: [
                { id: 'a1', full_name: 'Agent Alice' },
                { id: 'a2', full_name: 'Agent Bob' },
            ],
            error: null,
        });

        const result = await getDirectReports('mgr-1');
        expect(result.data).toEqual([
            { id: 'a1', full_name: 'Agent Alice' },
            { id: 'a2', full_name: 'Agent Bob' },
        ]);
        expect(result.error).toBeNull();
    });

    it('filters by role when roleFilter provided', async () => {
        const chain = mockSupa.__getChain('users');
        mockResolve(chain, {
            data: [{ id: 'a1', full_name: 'Agent Alice' }],
            error: null,
        });

        const result = await getDirectReports('mgr-1', { roleFilter: 'agent' });
        expect(result.data).toHaveLength(1);
        expect(result.error).toBeNull();
    });

    it('returns empty array when no reports', async () => {
        const chain = mockSupa.__getChain('users');
        mockResolve(chain, { data: [], error: null });

        const result = await getDirectReports('mgr-1');
        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
    });

    it('returns error on query failure', async () => {
        const chain = mockSupa.__getChain('users');
        mockResolve(chain, { data: null, error: { message: 'Connection timeout' } });

        const result = await getDirectReports('mgr-1');
        expect(result.data).toEqual([]);
        expect(result.error).toBe('Connection timeout');
    });
});
