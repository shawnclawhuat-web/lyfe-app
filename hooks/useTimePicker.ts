/**
 * Hook encapsulating time picker state for event creation/editing.
 * Manages start/end time wheel picker indices + optional end time toggle.
 */
import { useCallback, useState } from 'react';
import { formatPickerTime, hhmm24ToPickerState, pickerToHHMM24 } from '@/constants/ui';

interface TimePickerState {
    startHour: number;
    startMinIdx: number;
    startAmPm: number;
    endHour: number;
    endMinIdx: number;
    endAmPm: number;
    hasEndTime: boolean;
    showTimePicker: 'start' | 'end' | null;
    setStartHour: (v: number) => void;
    setStartMinIdx: (v: number) => void;
    setStartAmPm: (v: number) => void;
    setEndHour: (v: number) => void;
    setEndMinIdx: (v: number) => void;
    setEndAmPm: (v: number) => void;
    setHasEndTime: (v: boolean) => void;
    setShowTimePicker: (v: 'start' | 'end' | null) => void;
    toStartTimeStr: () => string;
    toEndTimeStr: () => string | null;
    formatStart: () => string;
    formatEnd: () => string;
    populateFromEdit: (startTime: string, endTime: string | null) => void;
}

export function useTimePicker(): TimePickerState {
    // Default 9:00 AM
    const [startHour, setStartHour] = useState(8); // index 8 → '9'
    const [startMinIdx, setStartMinIdx] = useState(0);
    const [startAmPm, setStartAmPm] = useState(0); // 0 = AM
    // Default 5:00 PM
    const [endHour, setEndHour] = useState(4); // index 4 → '5'
    const [endMinIdx, setEndMinIdx] = useState(0);
    const [endAmPm, setEndAmPm] = useState(1); // 1 = PM
    const [hasEndTime, setHasEndTime] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

    const toStartTimeStr = useCallback(
        () => pickerToHHMM24(startHour, startMinIdx, startAmPm),
        [startHour, startMinIdx, startAmPm],
    );

    const toEndTimeStr = useCallback(
        () => (hasEndTime ? pickerToHHMM24(endHour, endMinIdx, endAmPm) : null),
        [hasEndTime, endHour, endMinIdx, endAmPm],
    );

    const formatStart = useCallback(
        () => formatPickerTime(startHour, startMinIdx, startAmPm),
        [startHour, startMinIdx, startAmPm],
    );

    const formatEnd = useCallback(() => formatPickerTime(endHour, endMinIdx, endAmPm), [endHour, endMinIdx, endAmPm]);

    const toHHMM = (t: string | null | undefined) => (t ?? '').slice(0, 5);

    const populateFromEdit = useCallback((startTime: string, endTime: string | null) => {
        const sp = hhmm24ToPickerState(toHHMM(startTime) || '09:00');
        setStartHour(sp.hour);
        setStartMinIdx(sp.minIdx);
        setStartAmPm(sp.ampm);
        if (endTime) {
            const ep = hhmm24ToPickerState(toHHMM(endTime));
            setEndHour(ep.hour);
            setEndMinIdx(ep.minIdx);
            setEndAmPm(ep.ampm);
            setHasEndTime(true);
        }
    }, []);

    return {
        startHour,
        startMinIdx,
        startAmPm,
        endHour,
        endMinIdx,
        endAmPm,
        hasEndTime,
        showTimePicker,
        setStartHour,
        setStartMinIdx,
        setStartAmPm,
        setEndHour,
        setEndMinIdx,
        setEndAmPm,
        setHasEndTime,
        setShowTimePicker,
        toStartTimeStr,
        toEndTimeStr,
        formatStart,
        formatEnd,
        populateFromEdit,
    };
}
