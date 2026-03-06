import Avatar from '@/components/Avatar';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { deleteEvent, fetchEventById } from '@/lib/events';
import { isMockMode } from '@/lib/mockMode';
import type { AgencyEvent, AttendeeRole, EventAttendee } from '@/types/event';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/event';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Mock events (reused from index) ──────────────────────────
const today = new Date();
const fd = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
};

const MOCK_EVENTS: AgencyEvent[] = [
    { id: 'e1', title: 'Agency Kickoff 2026', description: 'Annual agency kickoff event for all staff. Please wear formal attire.', event_type: 'agency_event', event_date: fd(0), start_time: '09:00', end_time: '12:00', location: 'Marina Bay Sands Convention Centre', created_by: 'mock-user-id', creator_name: 'Mgr. David Lim', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), attendees: [{ id: 'a1', event_id: 'e1', user_id: 'u1', attendee_role: 'host', full_name: 'David Lim' }, { id: 'a2', event_id: 'e1', user_id: 'u2', attendee_role: 'presenter', full_name: 'Dr. Ng Wei' }, { id: 'a3', event_id: 'e1', user_id: 'u3', attendee_role: 'attendee', full_name: 'Alice Tan' }, { id: 'a4', event_id: 'e1', user_id: 'u4', attendee_role: 'attendee', full_name: 'Bob Lee' }, { id: 'a5', event_id: 'e1', user_id: 'u5', attendee_role: 'attendee', full_name: 'Sarah Wong' }], external_attendees: [{ name: 'John Smith (Client)', attendee_role: 'attendee' }, { name: 'Jane Doe (Prospect)', attendee_role: 'attendee' }] },
    { id: 'e2', title: 'M9 Exam Training', description: 'Prepare for the M9 certification paper.', event_type: 'training', event_date: fd(2), start_time: '14:00', end_time: '17:00', location: 'Lyfe Office, Level 12', created_by: 'mock-user-id', creator_name: 'Mgr. David Lim', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), attendees: [{ id: 'a5', event_id: 'e2', user_id: 'u5', attendee_role: 'presenter', full_name: 'Dr. Ng Wei' }, { id: 'a6', event_id: 'e2', user_id: 'u6', attendee_role: 'attendee', full_name: 'Jason Teo' }], external_attendees: [] },
    { id: 'e3', title: 'Team Weekly Sync', description: null, event_type: 'team_meeting', event_date: fd(5), start_time: '10:00', end_time: '11:00', location: 'Zoom', created_by: 'mock-user-id', creator_name: 'Mgr. David Lim', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), attendees: [{ id: 'a7', event_id: 'e3', user_id: 'u7', attendee_role: 'attendee', full_name: 'Emily Koh' }], external_attendees: [] },
    { id: 'e4', title: 'Roadshow @ Tampines', description: null, event_type: 'roadshow', event_date: fd(7), start_time: '11:00', end_time: '18:00', location: 'Tampines Mall Atrium', created_by: 'mock-user-id', creator_name: 'Mgr. David Lim', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), attendees: [], external_attendees: [] },
];

const ROLE_ORDER: AttendeeRole[] = ['host', 'duty_manager', 'presenter', 'attendee'];
const ROLE_LABELS: Record<AttendeeRole, string> = {
    host: 'Host',
    duty_manager: 'Duty Manager',
    presenter: 'Presenter',
    attendee: 'Attendee',
};
const ROLE_COLORS: Record<AttendeeRole, string> = {
    host: '#EC4899',
    duty_manager: '#6366F1',
    presenter: '#0A7E6B',
    attendee: '#8E8E93',
};

const AVATAR_COLORS = ['#6366F1', '#0D9488', '#E11D48', '#F59E0B', '#8B5CF6'];

export default function EventDetailScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const MOCK_OTP = isMockMode();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const [event, setEvent] = useState<AgencyEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadEvent = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        if (MOCK_OTP) {
            const found = MOCK_EVENTS.find(e => e.id === eventId) || MOCK_EVENTS[0];
            setEvent(found);
            setIsLoading(false);
            setRefreshing(false);
            return;
        }
        if (!eventId) return;
        const { data } = await fetchEventById(eventId);
        setEvent(data);
        setIsLoading(false);
        setRefreshing(false);
    }, [eventId]);

    useFocusEffect(useCallback(() => {
        // First load: full loading state. Return from edit: silent refresh with pull indicator.
        if (event) {
            loadEvent(true);
        } else {
            loadEvent(false);
        }
    }, [loadEvent]));

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatCreatedAt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader title="Event" showBack onBack={() => router.back()} />
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader title="Event" showBack onBack={() => router.back()} />
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Event not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const typeColor = EVENT_TYPE_COLORS[event.event_type];

    const canEdit = !!user && (
        user.id === event.created_by ||
        user.role === 'admin' ||
        (user.role === 'pa' && user.reports_to === event.created_by)
    );

    const canDelete = !!user && (
        user.id === event.created_by ||
        user.role === 'admin'
    );

    const handleDelete = () => {
        Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = MOCK_OTP
                            ? { error: null }
                            : await deleteEvent(event.id);
                        if (error) {
                            Alert.alert('Error', error);
                        } else {
                            router.back();
                        }
                    },
                },
            ],
        );
    };

    // Group internal attendees by role
    const grouped: Record<AttendeeRole, EventAttendee[]> = {
        host: [],
        duty_manager: [],
        presenter: [],
        attendee: [],
    };
    event.attendees.forEach(a => {
        if (grouped[a.attendee_role]) grouped[a.attendee_role].push(a);
    });

    const totalAttendees = event.attendees.length + (event.external_attendees?.length ?? 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title="Event Detail"
                showBack
                onBack={() => router.back()}
                rightAction={(canEdit || canDelete) ? (
                    <View style={styles.headerActions}>
                        {canEdit && (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/events/create' as any, params: { eventId: event.id } })}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Edit event"
                            >
                                <Ionicons name="pencil-outline" size={22} color={colors.accent} />
                            </TouchableOpacity>
                        )}
                        {canDelete && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Delete event"
                            >
                                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : undefined}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadEvent(true)}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* Hero */}
                <View style={[styles.hero, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.typePill, { backgroundColor: typeColor + '18' }]}>
                        <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
                        <Text style={[styles.typePillText, { color: typeColor }]}>
                            {EVENT_TYPE_LABELS[event.event_type]}
                        </Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{event.title}</Text>

                    {/* Date */}
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {formatDate(event.event_date)}
                        </Text>
                    </View>

                    {/* Time */}
                    <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {formatTime(event.start_time)}
                            {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                        </Text>
                    </View>

                    {/* Location */}
                    {event.location && (
                        <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {event.location}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {event.description && (
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Description</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {event.description}
                        </Text>
                    </View>
                )}

                {/* Attendees */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        Attendees ({totalAttendees})
                    </Text>

                    {totalAttendees === 0 ? (
                        <Text style={[styles.noAttendees, { color: colors.textTertiary }]}>
                            No attendees added yet
                        </Text>
                    ) : (
                        <>
                            {ROLE_ORDER.filter(r => grouped[r].length > 0).map(role => (
                                <View key={role} style={styles.roleGroup}>
                                    <Text style={[styles.roleGroupLabel, { color: colors.textTertiary }]}>
                                        {ROLE_LABELS[role]}
                                    </Text>
                                    {grouped[role].map(a => {
                                        const avatarColor = AVATAR_COLORS[(a.full_name ?? '?').charCodeAt(0) % AVATAR_COLORS.length];
                                        const roleColor = ROLE_COLORS[a.attendee_role];
                                        return (
                                            <View key={a.id} style={styles.attendeeRow}>
                                                <Avatar
                                                    name={a.full_name ?? '?'}
                                                    avatarUrl={a.avatar_url}
                                                    size={36}
                                                    backgroundColor={avatarColor + '18'}
                                                    textColor={avatarColor}
                                                />
                                                <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                                    {a.full_name}
                                                </Text>
                                                <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
                                                    <Text style={[styles.roleText, { color: roleColor }]}>
                                                        {ROLE_LABELS[a.attendee_role]}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                            {(event.external_attendees?.length ?? 0) > 0 && (
                                <View style={styles.roleGroup}>
                                    <Text style={[styles.roleGroupLabel, { color: colors.textTertiary }]}>External Guests</Text>
                                    {event.external_attendees.map((a, i) => {
                                        const avatarColor = AVATAR_COLORS[a.name.charCodeAt(0) % AVATAR_COLORS.length];
                                        const roleColor = ROLE_COLORS[a.attendee_role] ?? '#8E8E93';
                                        return (
                                            <View key={i} style={styles.attendeeRow}>
                                                <Avatar
                                                    name={a.name}
                                                    avatarUrl={null}
                                                    size={36}
                                                    backgroundColor={avatarColor + '18'}
                                                    textColor={avatarColor}
                                                />
                                                <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                                    {a.name}
                                                </Text>
                                                <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
                                                    <Text style={[styles.roleText, { color: roleColor }]}>
                                                        {ROLE_LABELS[a.attendee_role] ?? a.attendee_role}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: colors.cardBackground }]}>
                    {event.creator_name && (
                        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                            Created by {event.creator_name}
                        </Text>
                    )}
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        {formatCreatedAt(event.created_at)}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    notFoundText: { fontSize: 16 },

    // Hero
    hero: {
        borderRadius: 16,
        padding: 20,
        gap: 10,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeDot: { width: 6, height: 6, borderRadius: 3 },
    typePillText: { fontSize: 12, fontWeight: '700' },
    heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, lineHeight: 28 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: 14, flex: 1 },

    // Cards
    card: { borderRadius: 16, padding: 16, gap: 12 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    description: { fontSize: 14, lineHeight: 21 },
    noAttendees: { fontSize: 14 },

    // Attendees
    roleGroup: { gap: 8, marginTop: 4 },
    roleGroupLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontWeight: '700' },
    attendeeName: { flex: 1, fontSize: 15, fontWeight: '500' },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    roleText: { fontSize: 11, fontWeight: '700' },

    // Footer
    footer: { borderRadius: 12, padding: 14, alignItems: 'center' },
    footerText: { fontSize: 13 },

    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
