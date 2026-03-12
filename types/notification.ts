/**
 * Notification types for the in-app notification inbox.
 */
import type { Tables } from './supabase';

export type AppNotification = Tables<'notifications'>;

export type NotificationType =
    | 'event_reminder'
    | 'candidate_update'
    | 'lead_milestone'
    | 'agency_announcement'
    | 'roadshow_pledge'
    | 'new_lead';

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { icon: string; label: string }> = {
    event_reminder: { icon: 'calendar', label: 'Event Reminder' },
    candidate_update: { icon: 'person-add', label: 'Candidate Update' },
    lead_milestone: { icon: 'trophy', label: 'Lead Milestone' },
    agency_announcement: { icon: 'megaphone', label: 'Agency Announcement' },
    roadshow_pledge: { icon: 'hand-left', label: 'Roadshow Pledge' },
    new_lead: { icon: 'person-add', label: 'New Lead' },
};
