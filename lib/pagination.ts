/**
 * Pagination utilities — shared helpers for paginated Supabase queries.
 *
 * Convention: request `pageSize + 1` rows via `.range(from, to)` where
 * `to = from + pageSize`. If the result has more rows than `pageSize`,
 * there are more pages.
 */

/**
 * Apply `.range()` to a Supabase query builder when `page` is defined.
 * Returns the (possibly unchanged) query and the computed `from` offset.
 */
export function applyPageRange<Q extends { range: (from: number, to: number) => Q }>(
    query: Q,
    page: number | undefined,
    pageSize: number,
): Q {
    if (page === undefined) return query;
    const from = page * pageSize;
    const to = from + pageSize;
    return query.range(from, to);
}

/**
 * Resolve a paginated result set: trim to `pageSize` and compute `hasMore`.
 * When `page` is undefined the full dataset is returned with `hasMore: false`.
 */
export function resolvePage<T>(
    results: T[],
    page: number | undefined,
    pageSize: number,
): { data: T[]; hasMore: boolean } {
    if (page === undefined) return { data: results, hasMore: false };
    const hasMore = results.length > pageSize;
    return { data: hasMore ? results.slice(0, pageSize) : results, hasMore };
}
