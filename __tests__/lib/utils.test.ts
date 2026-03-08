import { timeAgo } from '@/lib/dateTime';

describe('dateTime.timeAgo', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-08T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns "Just now" for less than 1 minute ago', () => {
        expect(timeAgo('2026-03-08T11:59:30Z')).toBe('Just now');
    });

    it('returns minutes for < 60 minutes', () => {
        expect(timeAgo('2026-03-08T11:55:00Z')).toBe('5m ago');
    });

    it('returns hours for < 24 hours', () => {
        expect(timeAgo('2026-03-08T10:00:00Z')).toBe('2h ago');
    });

    it('returns days for < 7 days', () => {
        expect(timeAgo('2026-03-07T12:00:00Z')).toBe('1d ago');
        expect(timeAgo('2026-03-05T12:00:00Z')).toBe('3d ago');
    });

    it('returns formatted date for >= 7 days', () => {
        const result = timeAgo('2026-02-28T12:00:00Z');
        // Should be a formatted date like "28 Feb" (locale-dependent)
        expect(result).toContain('Feb');
        expect(result).toContain('28');
    });
});
