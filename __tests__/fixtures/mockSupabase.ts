/**
 * Reusable mock factory for the Supabase client.
 *
 * Usage:
 *   jest.mock('@/lib/supabase', () => ({ supabase: createMockSupabase() }));
 *   const { supabase } = require('@/lib/supabase');
 *
 * Then configure per-test:
 *   (supabase.from('events').select as jest.Mock).__resolveNext({ data: [...], error: null });
 *
 * Or use the simpler chain helper:
 *   mockChain(supabase, { data: rows, error: null });
 */

/** A chainable mock that returns itself for every method call, then resolves with a value. */
export function createChainMock(resolveValue: any = { data: null, error: null }) {
  let _resolve = resolveValue;

  const chain: any = new Proxy(
    {},
    {
      get(_target, prop) {
        // Allow tests to set the resolve value
        if (prop === '__resolveWith') {
          return (val: any) => { _resolve = val; };
        }
        // When awaited, resolve with the current value
        if (prop === 'then') {
          return (onFulfilled: any) => Promise.resolve(_resolve).then(onFulfilled);
        }
        // Any other property returns a jest.fn that returns the chain
        if (!chain[`_${String(prop)}`]) {
          chain[`_${String(prop)}`] = jest.fn(() => chain);
        }
        return chain[`_${String(prop)}`];
      },
    },
  );

  return chain;
}

/**
 * Create a full mock supabase client.
 * Each `.from(table)` call returns a fresh chain; override resolution per-test.
 */
export function createMockSupabase() {
  const chains: Record<string, ReturnType<typeof createChainMock>> = {};

  const supabase: any = {
    from: jest.fn((table: string) => {
      if (!chains[table]) {
        chains[table] = createChainMock();
      }
      return chains[table];
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } } }),
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    // Helper to get a table chain for test setup
    __getChain: (table: string) => {
      if (!chains[table]) chains[table] = createChainMock();
      return chains[table];
    },
    // Reset all chains between tests
    __resetChains: () => {
      Object.keys(chains).forEach((k) => delete chains[k]);
    },
  };

  return supabase;
}

/**
 * Convenience: set the resolution value for the NEXT await on a chain.
 */
export function mockResolve(chain: any, value: any) {
  chain.__resolveWith(value);
}
