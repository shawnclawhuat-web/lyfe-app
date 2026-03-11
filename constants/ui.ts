/**
 * Shared UI constants — colour palettes, picker data, and display configs
 */
import type { AttendeeRole } from '@/types/event';

import { ACTIVITY_TYPE_CONFIG } from './displayConfigs';
import type { RoadshowActivityType } from '@/types/event';

// ── Avatar colour palettes ─────────────────────────────────────
export const AVATAR_COLORS = ['#6366F1', '#FF7600', '#E11D48', '#F59E0B', '#8B5CF6', '#06B6D4'];
export const PA_MANAGER_COLORS = ['#6366F1', '#FF7600', '#E11D48', '#F59E0B', '#8B5CF6'];

/** Deterministic avatar colour from a name string */
export function getAvatarColor(name: string): string {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Attendee role display config ────────────────────────────────
export const ATTENDEE_ROLE_ORDER: AttendeeRole[] = ['host', 'duty_manager', 'presenter', 'attendee'];
export const ATTENDEE_ROLE_LABELS: Record<AttendeeRole, string> = {
    host: 'Host',
    duty_manager: 'Duty Manager',
    presenter: 'Presenter',
    attendee: 'Attendee',
};
export const ATTENDEE_ROLE_COLORS: Record<AttendeeRole, string> = {
    host: '#EC4899',
    duty_manager: '#6366F1',
    presenter: '#FF7600',
    attendee: '#8E8E93',
};

export const ATTENDEE_ROLES: { key: AttendeeRole; label: string }[] = [
    { key: 'attendee', label: 'Attendee' },
    { key: 'host', label: 'Host' },
    { key: 'duty_manager', label: 'Duty Mgr' },
    { key: 'presenter', label: 'Presenter' },
];

// ── User role display labels ────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    director: 'Director',
    manager: 'Manager',
    agent: 'Agent',
    pa: 'Personal Assistant',
    candidate: 'Candidate',
};

// ── Time picker constants ───────────────────────────────────────
export const PICKER_HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
export const PICKER_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
export const PICKER_AMPM = ['AM', 'PM'];
export const TIME_PICKER_VISIBLE = 3;

export function formatPickerTime(hour: number, minIdx: number, ampm: number): string {
    return `${hour + 1}:${PICKER_MINUTES[minIdx]} ${PICKER_AMPM[ampm]}`;
}

export function hhmm24ToPickerState(hhmm: string): { hour: number; minIdx: number; ampm: number } {
    const parts = hhmm.split(':');
    let h = parseInt(parts[0] ?? '9', 10);
    const rawMin = parseInt(parts[1] ?? '0', 10);
    const ampm = h >= 12 ? 1 : 0;
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const minIdx = Math.max(0, Math.min(PICKER_MINUTES.length - 1, Math.round(rawMin / 5)));
    return { hour: h - 1, minIdx, ampm };
}

export function pickerToHHMM24(hour: number, minIdx: number, ampm: number): string {
    let h = hour + 1;
    if (ampm === 1 && h !== 12) h += 12;
    if (ampm === 0 && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${PICKER_MINUTES[minIdx]}`;
}

// ── Error banner colours ──────────────────────────────────────
export const ERROR_BG = '#FEE2E2';
export const ERROR_TEXT = '#DC2626';

// ── Interview status colours ─────────────────────────────────
export const INTERVIEW_STATUS_COLORS: Record<string, string> = {
    completed: '#34C759',
    cancelled: '#FF3B30',
    rescheduled: '#AF52DE',
    scheduled: '#EAB308',
};

// ── Roadshow constants ──────────────────────────────────────────
export const ROADSHOW_PINK = '#EC4899';

/** Default pledge values when no roadshow config is provided */
export const DEFAULT_PLEDGED_SITDOWNS = 5;
export const DEFAULT_PLEDGED_PITCHES = 3;
export const DEFAULT_PLEDGED_CLOSED = 1;

export function activityLabel(type: string): string {
    return ACTIVITY_TYPE_CONFIG[type as RoadshowActivityType]?.label ?? type;
}

export function activityTypeColor(type: string, fallback: string): string {
    return ACTIVITY_TYPE_CONFIG[type as RoadshowActivityType]?.color ?? fallback;
}

// ── Animation timing ──────────────────────────────────────────
export const ANIM = {
    MICRO: 200, // hover, press, toggle
    TRANSITION: 300, // tab switch, modal slide
    REVEAL: 600, // progress bar, entrance
} as const;

// ── Spacing scale (4pt grid) ──────────────────────────────────
export const SPACING = {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
} as const;

// ── Icon sizes ─────────────────────────────────────────────────
export const ICON = {
    SM: 16, // inline, badges, meta
    MD: 20, // list items, actions
    LG: 24, // headers, primary actions
    XL: 32, // empty states, heroes
} as const;
