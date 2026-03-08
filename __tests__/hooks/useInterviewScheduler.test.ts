import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useInterviewScheduler } from '@/hooks/useInterviewScheduler';
import type { Interview } from '@/types/recruitment';

jest.mock('@/lib/supabase');
jest.mock('@/lib/recruitment', () => ({
    scheduleInterview: jest.fn().mockResolvedValue({
        data: {
            id: 'iv_new',
            candidate_id: 'c1',
            manager_id: 'm1',
            scheduled_by_id: 'u1',
            round_number: 1,
            type: 'zoom',
            datetime: '2026-04-01T10:00:00.000Z',
            location: null,
            zoom_link: null,
            google_calendar_event_id: null,
            status: 'scheduled',
            notes: null,
            created_at: '2026-03-09T00:00:00.000Z',
        },
        error: null,
    }),
    updateInterview: jest.fn().mockResolvedValue({
        data: {
            id: 'iv_1',
            candidate_id: 'c1',
            manager_id: 'm1',
            scheduled_by_id: 'u1',
            round_number: 1,
            type: 'in_person',
            datetime: '2026-04-02T14:00:00.000Z',
            location: 'Office',
            zoom_link: null,
            google_calendar_event_id: null,
            status: 'scheduled',
            notes: null,
            created_at: '2026-03-09T00:00:00.000Z',
        },
        error: null,
    }),
    deleteInterview: jest.fn().mockResolvedValue({ error: null }),
}));

const { scheduleInterview, updateInterview, deleteInterview } = require('@/lib/recruitment');

const mockInterview: Interview = {
    id: 'iv_1',
    candidate_id: 'c1',
    manager_id: 'm1',
    scheduled_by_id: 'u1',
    round_number: 1,
    type: 'zoom',
    datetime: '2026-04-01T10:00:00.000Z',
    location: null,
    zoom_link: 'https://zoom.us/j/123',
    google_calendar_event_id: null,
    status: 'scheduled',
    notes: 'Test notes',
    created_at: '2026-03-09T00:00:00.000Z',
};

const defaultParams = {
    candidateId: 'c1',
    candidateManagerId: 'm1',
    candidateInterviewCount: 0,
    userId: 'u1',
    onInterviewChanged: jest.fn(),
};

describe('useInterviewScheduler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useInterviewScheduler(defaultParams));
        expect(result.current.showScheduleSheet).toBe(false);
        expect(result.current.editingInterview).toBeNull();
        expect(result.current.scheduleType).toBe('zoom');
        expect(result.current.scheduleAmPm).toBe('AM');
        expect(result.current.isScheduling).toBe(false);
        expect(result.current.scheduleError).toBeNull();
    });

    it('openNewInterview resets form state and opens sheet', () => {
        const { result } = renderHook(() => useInterviewScheduler(defaultParams));
        // First edit an interview to change state
        act(() => result.current.openEditInterview(mockInterview));
        expect(result.current.editingInterview).toBe(mockInterview);

        // Now open a new interview — should reset
        act(() => result.current.openNewInterview());
        expect(result.current.showScheduleSheet).toBe(true);
        expect(result.current.editingInterview).toBeNull();
        expect(result.current.scheduleType).toBe('zoom');
        expect(result.current.scheduleLink).toBe('');
        expect(result.current.scheduleNotes).toBe('');
        expect(result.current.scheduleHour).toBe(10);
        expect(result.current.scheduleMinute).toBe(0);
        expect(result.current.scheduleAmPm).toBe('AM');
    });

    it('openEditInterview populates from existing interview', () => {
        const { result } = renderHook(() => useInterviewScheduler(defaultParams));
        act(() => result.current.openEditInterview(mockInterview));

        expect(result.current.showScheduleSheet).toBe(true);
        expect(result.current.editingInterview).toBe(mockInterview);
        expect(result.current.scheduleType).toBe('zoom');
        expect(result.current.scheduleLink).toBe('https://zoom.us/j/123');
        expect(result.current.scheduleNotes).toBe('Test notes');
        expect(result.current.scheduleStatus).toBe('scheduled');
    });

    it('submitSchedule calls scheduleInterview for new interview', async () => {
        // Use a future date to avoid the "past date" alert
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const { result } = renderHook(() => useInterviewScheduler(defaultParams));
        act(() => result.current.openNewInterview());
        act(() => result.current.setScheduleDate(futureDate));

        await act(async () => {
            await result.current.handleSubmitSchedule();
        });

        expect(scheduleInterview).toHaveBeenCalledWith(
            expect.objectContaining({
                candidateId: 'c1',
                managerId: 'm1',
                scheduledById: 'u1',
                roundNumber: 1,
                type: 'zoom',
            }),
        );
        expect(defaultParams.onInterviewChanged).toHaveBeenCalledWith('created', expect.any(Object));
    });

    it('handleDeleteInterview calls deleteInterview', () => {
        const onChanged = jest.fn();
        const { result } = renderHook(() => useInterviewScheduler({ ...defaultParams, onInterviewChanged: onChanged }));

        const alertSpy = jest.spyOn(Alert, 'alert');
        act(() => result.current.handleDeleteInterview(mockInterview));

        expect(alertSpy).toHaveBeenCalledWith(
            'Delete Interview',
            expect.stringContaining('Round 1'),
            expect.any(Array),
        );

        // Simulate pressing "Delete"
        const deleteBtn = alertSpy.mock.calls[0][2]!.find((b: any) => b.text === 'Delete');
        act(() => deleteBtn!.onPress!());

        expect(deleteInterview).toHaveBeenCalledWith('iv_1');
        expect(onChanged).toHaveBeenCalledWith('deleted', mockInterview);
    });

    it('dismissScheduleSheet shows alert when editing', () => {
        const { result } = renderHook(() => useInterviewScheduler(defaultParams));
        act(() => result.current.openEditInterview(mockInterview));

        const alertSpy = jest.spyOn(Alert, 'alert');
        act(() => result.current.dismissScheduleSheet());

        expect(alertSpy).toHaveBeenCalledWith('Discard changes?', expect.any(String), expect.any(Array));
    });
});
