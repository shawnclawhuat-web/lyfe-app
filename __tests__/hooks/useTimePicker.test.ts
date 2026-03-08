import { renderHook, act } from '@testing-library/react-native';
import { useTimePicker } from '@/hooks/useTimePicker';

describe('useTimePicker', () => {
    it('initializes with default 9:00 AM start', () => {
        const { result } = renderHook(() => useTimePicker());
        expect(result.current.startHour).toBe(8); // index 8 → '9'
        expect(result.current.startMinIdx).toBe(0);
        expect(result.current.startAmPm).toBe(0); // AM
    });

    it('initializes with default 5:00 PM end', () => {
        const { result } = renderHook(() => useTimePicker());
        expect(result.current.endHour).toBe(4); // index 4 → '5'
        expect(result.current.endAmPm).toBe(1); // PM
        expect(result.current.hasEndTime).toBe(false);
    });

    it('toStartTimeStr returns 24h format', () => {
        const { result } = renderHook(() => useTimePicker());
        // Default: 9:00 AM → "09:00"
        expect(result.current.toStartTimeStr()).toBe('09:00');
    });

    it('toEndTimeStr returns null when hasEndTime is false', () => {
        const { result } = renderHook(() => useTimePicker());
        expect(result.current.toEndTimeStr()).toBeNull();
    });

    it('toEndTimeStr returns time when hasEndTime is true', () => {
        const { result } = renderHook(() => useTimePicker());
        act(() => result.current.setHasEndTime(true));
        expect(result.current.toEndTimeStr()).toBe('17:00');
    });

    it('formatStart returns display string', () => {
        const { result } = renderHook(() => useTimePicker());
        expect(result.current.formatStart()).toBe('9:00 AM');
    });

    it('populateFromEdit sets start and end time', () => {
        const { result } = renderHook(() => useTimePicker());
        act(() => result.current.populateFromEdit('14:30', '17:00'));
        expect(result.current.toStartTimeStr()).toBe('14:30');
        expect(result.current.hasEndTime).toBe(true);
        expect(result.current.toEndTimeStr()).toBe('17:00');
    });

    it('populateFromEdit with null end time does not set hasEndTime', () => {
        const { result } = renderHook(() => useTimePicker());
        act(() => result.current.populateFromEdit('10:00', null));
        expect(result.current.hasEndTime).toBe(false);
    });
});
