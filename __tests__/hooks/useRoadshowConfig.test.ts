import { renderHook, act } from '@testing-library/react-native';
import { useRoadshowConfig } from '@/hooks/useRoadshowConfig';

describe('useRoadshowConfig', () => {
    it('initializes with defaults', () => {
        const { result } = renderHook(() => useRoadshowConfig());
        expect(result.current.rsSlots).toBe(3);
        expect(result.current.rsGrace).toBe(15);
        expect(result.current.rsSitdowns).toBe(5);
        expect(result.current.rsPitches).toBe(3);
        expect(result.current.rsClosed).toBe(1);
        expect(result.current.rsWeeklyCost).toBe('');
        expect(result.current.rsConfigLocked).toBe(false);
    });

    it('populateFromExisting sets all config values', () => {
        const { result } = renderHook(() => useRoadshowConfig());
        const config = {
            id: 'cfg1',
            event_id: 'e1',
            weekly_cost: 500,
            slots_per_day: 5,
            expected_start_time: '09:00',
            late_grace_minutes: 10,
            suggested_sitdowns: 8,
            suggested_pitches: 6,
            suggested_closed: 2,
        };
        act(() => result.current.populateFromExisting(config as any, '2026-03-15'));
        expect(result.current.rsWeeklyCost).toBe('500');
        expect(result.current.rsSlots).toBe(5);
        expect(result.current.rsGrace).toBe(10);
        expect(result.current.rsSitdowns).toBe(8);
        expect(result.current.rsPitches).toBe(6);
        expect(result.current.rsClosed).toBe(2);
        expect(result.current.rsStartDate).toBe('2026-03-15');
        expect(result.current.rsEndDate).toBe('2026-03-15');
    });

    it('allows updating individual values', () => {
        const { result } = renderHook(() => useRoadshowConfig());
        act(() => result.current.setRsSlots(7));
        expect(result.current.rsSlots).toBe(7);

        act(() => result.current.setRsConfigLocked(true));
        expect(result.current.rsConfigLocked).toBe(true);
    });
});
