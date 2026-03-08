import { renderHook } from '@testing-library/react-native';
import { useFilteredList } from '@/hooks/useFilteredList';

interface TestItem {
  id: string;
  name: string;
  phone: string;
  status: string;
  updated_at?: string;
}

const ITEMS: TestItem[] = [
  { id: '1', name: 'Alice Tan', phone: '+6591111111', status: 'new', updated_at: '2026-03-01T10:00:00Z' },
  { id: '2', name: 'Bob Lim', phone: '+6592222222', status: 'contacted', updated_at: '2026-03-05T10:00:00Z' },
  { id: '3', name: 'Charlie Wong', phone: '+6593333333', status: 'new', updated_at: '2026-03-03T10:00:00Z' },
  { id: '4', name: 'Diana Chen', phone: '+6594444444', status: 'qualified', updated_at: '2026-03-08T10:00:00Z' },
  { id: '5', name: 'Edward Ng', phone: '+6595555555', status: 'contacted', updated_at: '2026-03-02T10:00:00Z' },
];

const SEARCH_FIELDS: (keyof TestItem)[] = ['name', 'phone'];

function renderFiltered(items: TestItem[], search: string, filter: string) {
  return renderHook(() =>
    useFilteredList(items, search, filter, 'status', SEARCH_FIELDS)
  );
}

// ── No filters ──

describe('useFilteredList — no filters', () => {
  it('returns all items when search is empty and filter is "all"', () => {
    const { result } = renderFiltered(ITEMS, '', 'all');
    expect(result.current.filtered).toHaveLength(5);
  });

  it('counts all statuses plus "all"', () => {
    const { result } = renderFiltered(ITEMS, '', 'all');
    expect(result.current.counts).toEqual({
      all: 5,
      new: 2,
      contacted: 2,
      qualified: 1,
    });
  });
});

// ── Search ──

describe('useFilteredList — search', () => {
  it('filters by name (case-insensitive)', () => {
    const { result } = renderFiltered(ITEMS, 'alice', 'all');
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('1');
  });

  it('filters by phone number', () => {
    const { result } = renderFiltered(ITEMS, '9333', 'all');
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('Charlie Wong');
  });

  it('returns empty when no matches', () => {
    const { result } = renderFiltered(ITEMS, 'zzzzz', 'all');
    expect(result.current.filtered).toHaveLength(0);
  });

  it('trims whitespace in search', () => {
    const { result } = renderFiltered(ITEMS, '  bob  ', 'all');
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('2');
  });

  it('matches partial names', () => {
    const { result } = renderFiltered(ITEMS, 'ng', 'all');
    // "Wong" and "Ng" both contain "ng"
    expect(result.current.filtered).toHaveLength(2);
  });
});

// ── Status filter ──

describe('useFilteredList — filter', () => {
  it('filters by status field', () => {
    const { result } = renderFiltered(ITEMS, '', 'new');
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((item) => item.status === 'new')).toBe(true);
  });

  it('returns empty for status with no items', () => {
    const { result } = renderFiltered(ITEMS, '', 'won');
    expect(result.current.filtered).toHaveLength(0);
  });

  it('counts are always based on full list, not filtered', () => {
    const { result } = renderFiltered(ITEMS, '', 'new');
    // Counts should reflect ALL items, not just filtered
    expect(result.current.counts.all).toBe(5);
    expect(result.current.counts.new).toBe(2);
    expect(result.current.counts.contacted).toBe(2);
  });
});

// ── Combined search + filter ──

describe('useFilteredList — search + filter', () => {
  it('applies both search and filter', () => {
    const { result } = renderFiltered(ITEMS, 'alice', 'new');
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('Alice Tan');
  });

  it('returns empty when search matches but filter does not', () => {
    const { result } = renderFiltered(ITEMS, 'alice', 'contacted');
    expect(result.current.filtered).toHaveLength(0);
  });
});

// ── Sorting ──

describe('useFilteredList — sorting', () => {
  it('sorts by updated_at descending (most recent first)', () => {
    const { result } = renderFiltered(ITEMS, '', 'all');
    const ids = result.current.filtered.map((item) => item.id);
    // Diana (Mar 8) > Bob (Mar 5) > Charlie (Mar 3) > Edward (Mar 2) > Alice (Mar 1)
    expect(ids).toEqual(['4', '2', '3', '5', '1']);
  });
});

// ── Edge cases ──

describe('useFilteredList — edge cases', () => {
  it('handles empty items array', () => {
    const { result } = renderFiltered([], '', 'all');
    expect(result.current.filtered).toHaveLength(0);
    expect(result.current.counts).toEqual({ all: 0 });
  });

  it('handles items without updated_at', () => {
    const items: TestItem[] = [
      { id: '1', name: 'Alice', phone: '123', status: 'new' },
      { id: '2', name: 'Bob', phone: '456', status: 'new' },
    ];
    const { result } = renderFiltered(items, '', 'all');
    expect(result.current.filtered).toHaveLength(2);
  });

  it('ignores non-string fields during search', () => {
    // searchFields includes 'name' and 'phone', both strings — should work fine
    const { result } = renderFiltered(ITEMS, '123', 'all');
    expect(result.current.filtered).toHaveLength(0);
  });
});
