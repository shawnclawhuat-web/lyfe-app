/**
 * Centralized display configurations for entities across the app.
 * Single source of truth for labels, colors, and icons.
 */
import type { EventType, RoadshowActivityType } from '@/types/event';

// ── Event type display config ──
export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; icon: string }> = {
    team_meeting: { label: 'Team Meeting', color: '#6366F1', icon: 'people' },
    training: { label: 'Training', color: '#FF7600', icon: 'school' },
    agency_event: { label: 'Agency Event', color: '#F59E0B', icon: 'business' },
    roadshow: { label: 'Roadshow', color: '#EC4899', icon: 'megaphone' },
    other: { label: 'Other', color: '#8E8E93', icon: 'ellipsis-horizontal' },
};

// ── Roadshow activity type display config ──
export const ACTIVITY_TYPE_CONFIG: Record<RoadshowActivityType, { label: string; color: string; icon: string }> = {
    sitdown: { label: 'Sitdown', color: '#FF7600', icon: 'people' },
    pitch: { label: 'Pitch', color: '#E67700', icon: 'megaphone' },
    case_closed: { label: 'Case Closed', color: '#F59E0B', icon: 'checkmark-circle' },
    check_in: { label: 'Checked in', color: '#6366F1', icon: 'checkmark' },
    departure: { label: 'Left booth', color: '#8E8E93', icon: 'exit' },
};

// ── Re-exports from type files (avoid moving to prevent import churn) ──
export { STATUS_CONFIG, PRODUCT_LABELS, SOURCE_LABELS, ACTIVITY_ICONS } from '@/types/lead';
export { CANDIDATE_STATUS_CONFIG } from '@/types/recruitment';
