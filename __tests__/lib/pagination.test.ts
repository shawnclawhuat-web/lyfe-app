import { applyPageRange, resolvePage } from '@/lib/pagination';

describe('resolvePage', () => {
    it('returns full data with hasMore false when page is undefined', () => {
        const items = [1, 2, 3, 4, 5];
        const result = resolvePage(items, undefined, 3);
        expect(result.data).toEqual([1, 2, 3, 4, 5]);
        expect(result.hasMore).toBe(false);
    });

    it('returns trimmed data with hasMore true when results exceed pageSize', () => {
        const items = [1, 2, 3, 4]; // pageSize + 1
        const result = resolvePage(items, 0, 3);
        expect(result.data).toEqual([1, 2, 3]);
        expect(result.hasMore).toBe(true);
    });

    it('returns data as-is with hasMore false when results fit pageSize', () => {
        const items = [1, 2];
        const result = resolvePage(items, 0, 3);
        expect(result.data).toEqual([1, 2]);
        expect(result.hasMore).toBe(false);
    });

    it('returns data with hasMore false when results exactly match pageSize', () => {
        const items = [1, 2, 3];
        const result = resolvePage(items, 0, 3);
        expect(result.data).toEqual([1, 2, 3]);
        expect(result.hasMore).toBe(false);
    });

    it('works for page > 0', () => {
        const items = [10, 11, 12, 13]; // pageSize + 1
        const result = resolvePage(items, 2, 3);
        expect(result.data).toEqual([10, 11, 12]);
        expect(result.hasMore).toBe(true);
    });

    it('handles empty results', () => {
        const result = resolvePage([], 0, 10);
        expect(result.data).toEqual([]);
        expect(result.hasMore).toBe(false);
    });
});

describe('applyPageRange', () => {
    it('does not call range when page is undefined', () => {
        const query = { range: jest.fn().mockReturnThis() };
        const result = applyPageRange(query, undefined, 20);
        expect(query.range).not.toHaveBeenCalled();
        expect(result).toBe(query);
    });

    it('calls range with correct from/to for page 0', () => {
        const query = { range: jest.fn().mockReturnThis() };
        applyPageRange(query, 0, 20);
        expect(query.range).toHaveBeenCalledWith(0, 20);
    });

    it('calls range with correct from/to for page 3', () => {
        const query = { range: jest.fn().mockReturnThis() };
        applyPageRange(query, 3, 10);
        expect(query.range).toHaveBeenCalledWith(30, 40);
    });
});
