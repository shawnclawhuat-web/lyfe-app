import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAllEvents } from '@/lib/events';
import { fetchCandidates } from '@/lib/recruitment';
import { supabase } from '@/lib/supabase';
import type { AgencyEvent } from '@/types/event';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/event';
import type { RecruitmentCandidate } from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { isMockMode } from '@/lib/mockMode';

interface AssignedManager {
    id: string;
    full_name: string;
    role: string;
}

// ── Mock data ────────────────────────────────────────────────
const MOCK_MANAGERS: AssignedManager[] = [
    { id: 'm1', full_name: 'David Lim', role: 'manager' },
    { id: 'm2', full_name: 'Emily Koh', role: 'manager' },
];

const now = Date.now();
const d = (days: number) => new Date(now - days * 86400000).toISOString();
const fd = (daysFromNow: number) => new Date(now + daysFromNow * 86400000).toISOString().split('T')[0];

const MOCK_CANDIDATES: RecruitmentCandidate[] = [
    { id: 'c1', name: 'Jason Teo', phone: '+65 9111 2222', email: 'jason.teo@gmail.com', status: 'applied', assigned_manager_id: 'm1', assigned_manager_name: 'David Lim', created_by_id: 'mock-user-id', invite_token: null, notes: null, interviews: [], created_at: d(1), updated_at: d(1) },
    { id: 'c2', name: 'Priya Sharma', phone: '+65 8222 3333', email: null, status: 'interview_scheduled', assigned_manager_id: 'm1', assigned_manager_name: 'David Lim', created_by_id: 'mock-user-id', invite_token: null, notes: null, interviews: [], created_at: d(5), updated_at: d(3) },
    { id: 'c3', name: 'Ahmad Razak', phone: '+65 9333 4444', email: null, status: 'interviewed', assigned_manager_id: 'm2', assigned_manager_name: 'Emily Koh', created_by_id: 'mock-user-id', invite_token: null, notes: null, interviews: [], created_at: d(10), updated_at: d(2) },
];

const MOCK_EVENTS: AgencyEvent[] = [
    { id: 'e1', title: 'Agency Kickoff 2026', description: null, event_type: 'agency_event', event_date: fd(2), start_time: '09:00', end_time: '12:00', location: 'Marina Bay Sands', created_by: 'mock-user-id', creator_name: null, created_at: d(3), updated_at: d(3), attendees: [{ id: 'a1', event_id: 'e1', user_id: 'u1', attendee_role: 'attendee', full_name: 'Alice Tan' }, { id: 'a2', event_id: 'e1', user_id: 'u2', attendee_role: 'attendee', full_name: 'Bob Lee' }], external_attendees: [] },
    { id: 'e2', title: 'M9 Exam Training', description: null, event_type: 'training', event_date: fd(5), start_time: '14:00', end_time: '17:00', location: 'Lyfe Office', created_by: 'mock-user-id', creator_name: null, created_at: d(1), updated_at: d(1), attendees: [{ id: 'a3', event_id: 'e2', user_id: 'u3', attendee_role: 'presenter', full_name: 'David Lim' }], external_attendees: [] },
    { id: 'e3', title: 'Team Weekly Sync', description: null, event_type: 'team_meeting', event_date: fd(7), start_time: '10:00', end_time: null, location: 'Zoom', created_by: 'mock-user-id', creator_name: null, created_at: d(0), updated_at: d(0), attendees: [], external_attendees: [] },
];

const AVATAR_COLORS = ['#6366F1', '#0D9488', '#E11D48', '#F59E0B', '#8B5CF6'];

export default function PaScreen() {
    const MOCK_OTP = isMockMode();
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(!MOCK_OTP);
    const [managers, setManagers] = useState<AssignedManager[]>([]);
    const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<AgencyEvent[]>([]);

    const loadData = useCallback(async () => {
        if (MOCK_OTP) {
            setManagers(MOCK_MANAGERS);
            setCandidates(MOCK_CANDIDATES);
            setUpcomingEvents(MOCK_EVENTS);
            return;
        }

        if (!user?.id) return;

        const today = new Date().toISOString().split('T')[0];

        const [managersResult, candidatesResult, eventsResult] = await Promise.all([
            supabase
                .from('pa_manager_assignments')
                .select('manager:users!pa_manager_assignments_manager_id_fkey(id, full_name, role)')
                .eq('pa_id', user.id),
            fetchCandidates(user.id, false),
            fetchAllEvents(),
        ]);

        if (managersResult.data) {
            setManagers((managersResult.data as any[]).map(r => r.manager).filter(Boolean));
        }

        if (!candidatesResult.error) {
            setCandidates(candidatesResult.data.slice(0, 5));
        }

        if (!eventsResult.error) {
            const upcoming = eventsResult.data
                .filter(e => e.event_date >= today)
                .slice(0, 5);
            setUpcomingEvents(upcoming);
        }

        setIsLoading(false);
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const getAvatarColor = (name: string) =>
        AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader title="PA Dashboard" />
                <LoadingState />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader title="PA Dashboard" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* ── Assigned Managers ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Assigned Managers</Text>

                    {managers.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
                            <Ionicons name="person-outline" size={28} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No managers assigned yet</Text>
                        </View>
                    ) : (
                        managers.map(mgr => {
                            const color = getAvatarColor(mgr.full_name);
                            return (
                                <View
                                    key={mgr.id}
                                    style={[styles.managerCard, { backgroundColor: colors.cardBackground }]}
                                >
                                    <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
                                        <Text style={[styles.avatarText, { color }]}>
                                            {mgr.full_name.split(' ').map(n => n[0]).join('')}
                                        </Text>
                                    </View>
                                    <View style={styles.managerInfo}>
                                        <Text style={[styles.managerName, { color: colors.textPrimary }]}>
                                            {mgr.full_name}
                                        </Text>
                                        <View style={[styles.roleBadge, { backgroundColor: colors.managerColorLight }]}>
                                            <Text style={[styles.roleText, { color: colors.managerColor }]}>Manager</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ── My Candidates ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Candidates</Text>
                        <TouchableOpacity onPress={() => router.push('/candidates' as any)}>
                            <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {candidates.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
                            <Ionicons name="document-text-outline" size={28} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No candidates yet</Text>
                        </View>
                    ) : (
                        candidates.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.candidateRow, { backgroundColor: colors.cardBackground }]}
                                onPress={() => router.push(`/candidates/${c.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.candidateDot, { backgroundColor: colors.accent }]} />
                                <View style={styles.candidateInfo}>
                                    <Text style={[styles.candidateName, { color: colors.textPrimary }]} numberOfLines={1}>
                                        {c.name}
                                    </Text>
                                    <Text style={[styles.candidateStatus, { color: colors.textTertiary }]}>
                                        {c.status.replace(/_/g, ' ')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.push('/team/add-candidate' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add" size={16} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Add Candidate</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Upcoming Events ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
                        <TouchableOpacity onPress={() => router.push('/events' as any)}>
                            <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {upcomingEvents.length === 0 ? (
                        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
                            <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No upcoming events</Text>
                        </View>
                    ) : (
                        upcomingEvents.map(event => {
                            const typeColor = EVENT_TYPE_COLORS[event.event_type];
                            return (
                                <TouchableOpacity
                                    key={event.id}
                                    style={[styles.eventCard, { backgroundColor: colors.cardBackground }]}
                                    onPress={() => router.push(`/events/${event.id}` as any)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.eventDateBadge, { backgroundColor: colors.accentLight }]}>
                                        <Text style={[styles.eventDay, { color: colors.accent }]}>
                                            {new Date(event.event_date + 'T00:00:00').getDate()}
                                        </Text>
                                        <Text style={[styles.eventMonth, { color: colors.accent }]}>
                                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-SG', { month: 'short' })}
                                        </Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                            {event.title}
                                        </Text>
                                        <View style={styles.eventMeta}>
                                            <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                                                <Text style={[styles.typeText, { color: typeColor }]}>
                                                    {EVENT_TYPE_LABELS[event.event_type]}
                                                </Text>
                                            </View>
                                            <Text style={[styles.eventTime, { color: colors.textTertiary }]}>
                                                {formatTime(event.start_time)}
                                            </Text>
                                        </View>
                                        <Text style={[styles.attendeeCount, { color: colors.textTertiary }]}>
                                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                </TouchableOpacity>
                            );
                        })
                    )}

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.push('/events/create' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Create Event</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12 },
    seeAll: { fontSize: 14, fontWeight: '600' },

    emptyCard: {
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: { fontSize: 14 },

    // Managers
    managerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 15, fontWeight: '700' },
    managerInfo: { flex: 1, gap: 4 },
    managerName: { fontSize: 15, fontWeight: '600' },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: { fontSize: 11, fontWeight: '700' },

    // Candidates
    candidateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 6,
    },
    candidateDot: { width: 8, height: 8, borderRadius: 4 },
    candidateInfo: { flex: 1 },
    candidateName: { fontSize: 15, fontWeight: '600' },
    candidateStatus: { fontSize: 12, marginTop: 1, textTransform: 'capitalize' },

    // Events
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    eventDateBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventDay: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
    eventMonth: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    eventInfo: { flex: 1, gap: 4 },
    eventTitle: { fontSize: 15, fontWeight: '600' },
    eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    typeText: { fontSize: 10, fontWeight: '700' },
    eventTime: { fontSize: 12 },
    attendeeCount: { fontSize: 12 },

    // Add button
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
