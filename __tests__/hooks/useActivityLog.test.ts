import { renderHook, act } from '@testing-library/react-native';
import { useActivityLog } from '@/hooks/useActivityLog';

const mockLogRoadshowActivity = jest.fn();

jest.mock('@/lib/events', () => ({
    logRoadshowActivity: (...args: any[]) => mockLogRoadshowActivity(...args),
}));

jest.mock('@/constants/ui', () => ({
    PICKER_MINUTES: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
}));

describe('useActivityLog', () => {
    const mockSetActivities = jest.fn((updater) => {
        if (typeof updater === 'function') updater([]);
    });

    const defaultParams = {
        eventId: 'e1',
        userId: 'user1',
        userFullName: 'Test User',
        myAttendance: {
            id: 'att1',
            event_id: 'e1',
            user_id: 'user1',
            full_name: 'Test User',
            checked_in_at: '2026-03-09T01:00:00.000Z',
            is_late: false,
            minutes_late: 0,
            late_reason: null,
            checked_in_by: null,
            pledged_sitdowns: 5,
            pledged_pitches: 3,
            pledged_closed: 1,
            pledged_afyc: 2000,
        } as any,
        activities: [] as any[],
        setActivities: mockSetActivities as any,
        onMilestone: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockLogRoadshowActivity.mockResolvedValue({ data: null, error: null });
    });

    it('handleLogActivity creates optimistic update', async () => {
        const { result } = renderHook(() => useActivityLog(defaultParams));

        await act(async () => {
            await result.current.handleLogActivity('sitdown');
        });

        // setActivities should have been called for optimistic update
        expect(mockSetActivities).toHaveBeenCalled();
        expect(mockLogRoadshowActivity).toHaveBeenCalledWith('e1', 'user1', 'sitdown', undefined, expect.any(String));
    });

    it('initLogTime sets current time values', () => {
        const { result } = renderHook(() => useActivityLog(defaultParams));

        act(() => {
            result.current.initLogTime();
        });

        // logHour, logMinuteIdx, logAmPm should be set to some valid values
        expect(result.current.logHour).toBeGreaterThanOrEqual(0);
        expect(result.current.logHour).toBeLessThanOrEqual(11);
        expect(result.current.logMinuteIdx).toBeGreaterThanOrEqual(0);
        expect(result.current.logMinuteIdx).toBeLessThanOrEqual(11);
        expect([0, 1]).toContain(result.current.logAmPm);
    });

    it('handleLogCaseClosed with AFYC amount', async () => {
        const { result } = renderHook(() => useActivityLog(defaultParams));

        // Set an AFYC input
        act(() => {
            result.current.setAfycInput('2000');
        });

        await act(async () => {
            await result.current.handleLogCaseClosed();
        });

        expect(mockLogRoadshowActivity).toHaveBeenCalledWith('e1', 'user1', 'case_closed', 2000, expect.any(String));
        expect(defaultParams.onMilestone).toHaveBeenCalled();
    });

    it('computes myCounts from activities', () => {
        const activitiesWithData = [
            {
                id: '1',
                event_id: 'e1',
                user_id: 'user1',
                type: 'sitdown',
                afyc_amount: null,
                logged_at: '',
                full_name: 'Test',
            },
            {
                id: '2',
                event_id: 'e1',
                user_id: 'user1',
                type: 'sitdown',
                afyc_amount: null,
                logged_at: '',
                full_name: 'Test',
            },
            {
                id: '3',
                event_id: 'e1',
                user_id: 'user1',
                type: 'pitch',
                afyc_amount: null,
                logged_at: '',
                full_name: 'Test',
            },
            {
                id: '4',
                event_id: 'e1',
                user_id: 'user1',
                type: 'case_closed',
                afyc_amount: 500,
                logged_at: '',
                full_name: 'Test',
            },
            {
                id: '5',
                event_id: 'e1',
                user_id: 'other',
                type: 'sitdown',
                afyc_amount: null,
                logged_at: '',
                full_name: 'Other',
            },
        ] as any[];

        const { result } = renderHook(() => useActivityLog({ ...defaultParams, activities: activitiesWithData }));

        expect(result.current.myCounts).toEqual({
            sitdowns: 2,
            pitches: 1,
            closed: 1,
            afyc: 500,
        });
    });
});
