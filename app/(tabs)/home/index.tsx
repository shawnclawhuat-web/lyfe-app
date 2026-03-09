import Avatar from '@/components/Avatar';
import ErrorBanner from '@/components/ErrorBanner';
import LyfeLogo from '@/components/LyfeLogo';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
    getBiometryType,
    hasShownBiometricsPrompt,
    isBiometricsAvailable,
    isBiometricsEnabled,
    markBiometricsPromptShown,
    type BiometryType,
} from '@/lib/biometrics';
import {
    fetchLeadStats,
    fetchManagerDashboardStats,
    fetchRecentActivities,
    type LeadPipelineStats,
    type ManagerDashboardStats,
} from '@/lib/leads';
import { formatDateShort, formatTime, timeAgo } from '@/lib/dateTime';
import { MOCK_AGENT_STATS, MOCK_LEAD_PIPELINE, MOCK_MANAGER_ACTIVITIES, MOCK_MANAGER_STATS } from '@/lib/mockData';
import { fetchUpcomingEvents } from '@/lib/events';
import { fetchPAManagerIds, fetchPACandidateCount, fetchPAInterviewCount } from '@/lib/recruitment';
import { EVENT_TYPE_COLORS, type AgencyEvent } from '@/types/event';
import { STATUS_CONFIG, type LeadActivity, type LeadActivityType } from '@/types/lead';
import { useTypedRouter } from '@/hooks/useTypedRouter';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// Map LeadActivity type → icon name
const ACTIVITY_ICONS: Record<LeadActivityType, string> = {
    created: 'person-add',
    note: 'create',
    call: 'call',
    whatsapp: 'logo-whatsapp',
    status_change: 'swap-horizontal',
    reassignment: 'swap-horizontal',
    email: 'mail',
    meeting: 'calendar',
    follow_up: 'time',
};

/** Convert Supabase LeadActivity (+ lead_name) → render shape */
function formatActivities(
    activities: (LeadActivity & { lead_name?: string })[],
): { id: string; type: string; leadName: string; detail: string; time: string; icon: string }[] {
    return activities.map((a) => {
        // Build detail string
        let detail = a.description || '';
        if (a.type === 'status_change' && a.metadata) {
            const from = a.metadata.from_status || '?';
            const to = a.metadata.to_status || '?';
            detail = `${from.charAt(0).toUpperCase() + from.slice(1)} → ${to.charAt(0).toUpperCase() + to.slice(1)}`;
        } else if (a.type === 'created') {
            detail = detail || 'Lead created';
        } else if (a.type === 'note') {
            detail = a.description
                ? `Note: ${a.description.substring(0, 40)}${a.description.length > 40 ? '...' : ''}`
                : 'Added a note';
        }

        const time = timeAgo(a.created_at);

        return {
            id: a.id,
            type: a.type,
            leadName: a.lead_name || 'Unknown',
            detail,
            time,
            icon: ACTIVITY_ICONS[a.type] || 'ellipse',
        };
    });
}

export default function HomeScreen() {
    const { colors } = useTheme();
    const { user, enableBiometrics } = useAuth();
    const { viewMode, canToggle, setViewMode } = useViewMode();
    const { unreadCount } = useNotifications();
    const router = useTypedRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isManagerView = canToggle && viewMode === 'manager';

    // Biometrics setup prompt (one-time, shown after first OTP login)
    const [showBiometricsPrompt, setShowBiometricsPrompt] = useState(false);
    const [biometryType, setBiometryType] = useState<BiometryType>('none');
    const [isEnablingBiometrics, setIsEnablingBiometrics] = useState(false);

    useEffect(() => {
        const checkBiometricsPrompt = async () => {
            const available = await isBiometricsAvailable();
            if (!available) return;
            const enabled = await isBiometricsEnabled();
            if (enabled) return;
            const shown = await hasShownBiometricsPrompt();
            if (shown) return;
            const type = await getBiometryType();
            setBiometryType(type);
            setShowBiometricsPrompt(true);
        };
        checkBiometricsPrompt();
    }, []);

    const handleEnableBiometrics = useCallback(async () => {
        setIsEnablingBiometrics(true);
        const success = await enableBiometrics();
        setIsEnablingBiometrics(false);
        if (success) {
            setShowBiometricsPrompt(false);
        }
    }, [enableBiometrics]);

    const handleDismissBiometricsPrompt = useCallback(async () => {
        await markBiometricsPromptShown();
        setShowBiometricsPrompt(false);
    }, []);

    // Real data state
    const [stats, setStats] = useState<LeadPipelineStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<(LeadActivity & { lead_name?: string })[]>([]);
    const [managerStats, setManagerStats] = useState<ManagerDashboardStats | null>(null);

    // PA state
    const [paStats, setPaStats] = useState<{ candidateCount: number; interviewCount: number; events: AgencyEvent[] }>({
        candidateCount: 0,
        interviewCount: 0,
        events: [],
    });

    // Agent events state
    const [agentEvents, setAgentEvents] = useState<AgencyEvent[]>([]);

    const greeting = useMemo(() => getGreeting(), []);
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    const role = user?.role;
    const isCandidate = role === 'candidate';
    const isPa = role === 'pa';
    const isAdminRole = role === 'admin';

    const loadDashboardData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setError(null);

            // ── PA branch ──
            if (isPa) {
                const managerIds = await fetchPAManagerIds(user.id);
                const [total, interviews, eventsResult] = await Promise.all([
                    fetchPACandidateCount(managerIds),
                    fetchPAInterviewCount(managerIds),
                    fetchUpcomingEvents(user.id, 5),
                ]);
                setPaStats({ candidateCount: total ?? 0, interviewCount: interviews ?? 0, events: eventsResult.data });
                return;
            }

            // ── Agent / Manager / Admin branch ──
            const isManagerLike = isManagerView || isAdminRole;
            const promises: Promise<any>[] = [
                fetchLeadStats(user.id, isManagerLike),
                fetchRecentActivities(user.id, isManagerLike, 5),
            ];
            if (isManagerLike && user.role) {
                promises.push(fetchManagerDashboardStats(user.id, user.role));
            }
            const results = await Promise.all(promises);
            if (results[0].data) setStats(results[0].data);
            if (results[1].data) setRecentActivities(results[1].data);
            if (results[2]?.data) setManagerStats(results[2].data);
            if (results[0].error) setError('Failed to load dashboard data');

            // Fetch upcoming events for agents
            if (!isManagerLike) {
                const eventsResult = await fetchUpcomingEvents(user.id, 5);
                setAgentEvents(eventsResult.data);
            }
        } catch {
            setError('Failed to load dashboard data');
        }
    }, [user?.id, isPa, isManagerView, isAdminRole, user?.role]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    }, [loadDashboardData]);

    // Use real stats or mock fallback
    const agentStats = stats || MOCK_AGENT_STATS;
    const pipeline = stats?.pipeline || MOCK_LEAD_PIPELINE;

    // Normalize recent activities for display
    const displayActivities = useMemo(
        () =>
            recentActivities.length > 0
                ? formatActivities(recentActivities)
                : isManagerView
                  ? MOCK_MANAGER_ACTIVITIES
                  : [],
        [recentActivities, isManagerView],
    );

    const totalPipeline = useMemo(() => pipeline.reduce((n, s) => n + s.count, 0), [pipeline]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Sticky Header */}
            <ScreenHeader
                title="Lyfe"
                titleElement={<LyfeLogo size="sm" />}
                rightAction={
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.bellBtn}
                            onPress={() => router.push('/(tabs)/home/notifications')}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={
                                unreadCount > 0
                                    ? `Notifications, ${unreadCount > 99 ? '99 plus' : unreadCount} unread`
                                    : 'Notifications'
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.avatarBtn}
                            onPress={() => router.push('/(tabs)/profile')}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Go to profile"
                        >
                            <Avatar
                                name={user?.full_name || '?'}
                                avatarUrl={user?.avatar_url}
                                size={44}
                                backgroundColor={colors.accentLight}
                                textColor={colors.accent}
                            />
                        </TouchableOpacity>
                    </View>
                }
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Greeting + View Mode */}
                <View style={styles.greetingRow}>
                    <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
                        {greeting}, {firstName}
                    </Text>
                    {canToggle && (
                        <View style={[styles.viewModeToggle, { backgroundColor: colors.inputBackground }]}>
                            <TouchableOpacity
                                style={[
                                    styles.viewModeBtn,
                                    viewMode === 'agent' && {
                                        backgroundColor: colors.cardBackground,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    },
                                ]}
                                onPress={() => setViewMode('agent')}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel="Switch to Agent View"
                                accessibilityState={{ selected: viewMode === 'agent' }}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={14}
                                    color={viewMode === 'agent' ? colors.accent : colors.textTertiary}
                                />
                                <Text
                                    style={[
                                        styles.viewModeBtnText,
                                        {
                                            color: viewMode === 'agent' ? colors.accent : colors.textTertiary,
                                            fontWeight: viewMode === 'agent' ? '600' : '400',
                                        },
                                    ]}
                                >
                                    Agent
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.viewModeBtn,
                                    viewMode === 'manager' && {
                                        backgroundColor: colors.cardBackground,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    },
                                ]}
                                onPress={() => setViewMode('manager')}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel="Switch to Manager View"
                                accessibilityState={{ selected: viewMode === 'manager' }}
                            >
                                <Ionicons
                                    name="shield-outline"
                                    size={14}
                                    color={viewMode === 'manager' ? colors.accent : colors.textTertiary}
                                />
                                <Text
                                    style={[
                                        styles.viewModeBtnText,
                                        {
                                            color: viewMode === 'manager' ? colors.accent : colors.textTertiary,
                                            fontWeight: viewMode === 'manager' ? '600' : '400',
                                        },
                                    ]}
                                >
                                    Manager
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {error && <ErrorBanner message={error} onRetry={loadDashboardData} onDismiss={() => setError(null)} />}

                {/* Hero Stats */}
                <View style={styles.heroStatsContainer}>
                    {isCandidate ? (
                        <>
                            <View style={styles.statsRow}>
                                <View style={[styles.heroCardPrimary, { backgroundColor: colors.accent }]}>
                                    <Ionicons
                                        name="school"
                                        size={80}
                                        color="rgba(255,255,255,0.15)"
                                        style={styles.heroIconBg}
                                    />
                                    <Text style={[styles.heroStatValue, { color: colors.textInverse }]}>2</Text>
                                    <Text style={[styles.heroStatLabel, { color: colors.textInverse, opacity: 0.9 }]}>
                                        Exams to Pass
                                    </Text>
                                </View>
                                <View style={styles.statsColumn}>
                                    <StatCardSmall label="Stage" value="Exam Prep" colors={colors} />
                                    <StatCardSmall label="Days Left" value="45" colors={colors} />
                                </View>
                            </View>
                        </>
                    ) : isPa ? (
                        <View style={styles.statsRow}>
                            <View style={[styles.heroCardPrimary, { backgroundColor: colors.accent }]}>
                                <Ionicons
                                    name="document-text"
                                    size={80}
                                    color="rgba(255,255,255,0.15)"
                                    style={styles.heroIconBg}
                                />
                                <Text style={[styles.heroStatValue, { color: colors.textInverse }]}>
                                    {paStats.candidateCount}
                                </Text>
                                <Text style={[styles.heroStatLabel, { color: colors.textInverse, opacity: 0.9 }]}>
                                    Candidates
                                </Text>
                            </View>
                            <View style={styles.statsColumn}>
                                <StatCardSmall
                                    label="Interviews"
                                    value={paStats.interviewCount.toString()}
                                    colors={colors}
                                />
                                <StatCardSmall
                                    label="Events"
                                    value={paStats.events.length.toString()}
                                    colors={colors}
                                />
                            </View>
                        </View>
                    ) : isAdminRole || isManagerView ? (
                        <>
                            <View style={styles.statsRow}>
                                <View style={[styles.heroCardPrimary, { backgroundColor: colors.accent }]}>
                                    <Ionicons
                                        name="people"
                                        size={80}
                                        color="rgba(255,255,255,0.15)"
                                        style={styles.heroIconBg}
                                    />
                                    <Text style={[styles.heroStatValue, { color: colors.textInverse }]}>
                                        {stats?.totalLeads || MOCK_MANAGER_STATS.teamLeads}
                                    </Text>
                                    <Text style={[styles.heroStatLabel, { color: colors.textInverse, opacity: 0.9 }]}>
                                        Team Leads
                                    </Text>
                                </View>
                                <View style={styles.statsColumn}>
                                    <StatCardSmall
                                        label="Candidates"
                                        value={(
                                            managerStats?.activeCandidates ?? MOCK_MANAGER_STATS.activeCandidates
                                        ).toString()}
                                        colors={colors}
                                    />
                                    <StatCardSmall
                                        label="Agents"
                                        value={(
                                            managerStats?.agentsManaged ?? MOCK_MANAGER_STATS.agentsManaged
                                        ).toString()}
                                        colors={colors}
                                    />
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.statsRow}>
                                <View style={[styles.heroCardPrimary, { backgroundColor: colors.accent }]}>
                                    <Ionicons
                                        name="briefcase"
                                        size={80}
                                        color="rgba(255,255,255,0.15)"
                                        style={styles.heroIconBg}
                                    />
                                    <Text style={[styles.heroStatValue, { color: colors.textInverse }]}>
                                        {agentStats.totalLeads}
                                    </Text>
                                    <Text style={[styles.heroStatLabel, { color: colors.textInverse, opacity: 0.9 }]}>
                                        Total Leads
                                    </Text>
                                </View>
                                <View style={styles.statsColumn}>
                                    <StatCardSmall
                                        label="New Leads"
                                        value={agentStats.newThisWeek.toString()}
                                        colors={colors}
                                    />
                                    <StatCardSmall
                                        label="Conversion"
                                        value={`${agentStats.conversionRate}%`}
                                        colors={colors}
                                    />
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={[styles.section, styles.quickActionsSection]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {isCandidate ? (
                            <>
                                <QuickActionBtn
                                    icon="school"
                                    label="Exams"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/exams')}
                                />
                                <QuickActionBtn
                                    icon="book"
                                    label="Study"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/exams/study')}
                                />
                                <QuickActionBtn
                                    icon="calendar"
                                    label="My Events"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/events')}
                                />
                                <QuickActionBtn
                                    icon="person"
                                    label="Profile"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/profile')}
                                />
                            </>
                        ) : isPa ? (
                            <>
                                <QuickActionBtn
                                    icon="person-add"
                                    label="Add Candidate"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/pa/add-candidate')}
                                />
                                <QuickActionBtn
                                    icon="document-text"
                                    label="Candidates"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/pa')}
                                />
                                <QuickActionBtn
                                    icon="calendar"
                                    label="Events"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/events')}
                                />
                                <QuickActionBtn
                                    icon="person"
                                    label="Profile"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/profile')}
                                />
                            </>
                        ) : isAdminRole ? (
                            <>
                                <QuickActionBtn
                                    icon="briefcase"
                                    label="Team"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/team')}
                                />
                                <QuickActionBtn
                                    icon="calendar"
                                    label="Events"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/events')}
                                />
                                <QuickActionBtn
                                    icon="people"
                                    label="Leads"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/leads')}
                                />
                                <QuickActionBtn
                                    icon="document-text"
                                    label="Candidates"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/home/candidates')}
                                />
                            </>
                        ) : isManagerView ? (
                            <>
                                <QuickActionBtn
                                    icon="person-add"
                                    label="Add Lead"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/leads/add')}
                                />
                                <QuickActionBtn
                                    icon="briefcase"
                                    label="Team"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/team')}
                                />
                                <QuickActionBtn
                                    icon="document-text"
                                    label="Candidates"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/home/candidates')}
                                />
                                <QuickActionBtn
                                    icon="analytics"
                                    label="Analytics"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/home/analytics')}
                                />
                            </>
                        ) : (
                            <>
                                <QuickActionBtn
                                    icon="person-add"
                                    label="Add Lead"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/leads/add')}
                                />
                                <QuickActionBtn
                                    icon="list"
                                    label="All Leads"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/leads')}
                                />
                                <QuickActionBtn
                                    icon="calendar"
                                    label="Events"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/events')}
                                />
                                <QuickActionBtn
                                    icon="bar-chart"
                                    label="Pipeline"
                                    colors={colors}
                                    onPress={() => router.push('/(tabs)/home/pipeline')}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* My Events — PA only */}
                {isPa && (
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Events</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                                <Text style={[styles.seeAllText, { color: colors.accent }]}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {paStats.events.length === 0 ? (
                            <Text style={[styles.emptyActivityText, { color: colors.textTertiary }]}>
                                No upcoming events
                            </Text>
                        ) : (
                            paStats.events.map((event) => {
                                const typeColor = EVENT_TYPE_COLORS[event.event_type] ?? colors.accent;
                                return (
                                    <TouchableOpacity
                                        key={event.id}
                                        style={styles.managerEventRow}
                                        onPress={() => router.push(`/(tabs)/pa/event/${event.id}`)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.managerEventStripe, { backgroundColor: typeColor }]} />
                                        <View style={styles.managerEventContent}>
                                            <Text
                                                style={[styles.managerEventTitle, { color: colors.textPrimary }]}
                                                numberOfLines={1}
                                            >
                                                {event.title}
                                            </Text>
                                            <Text style={[styles.managerEventMeta, { color: colors.textTertiary }]}>
                                                {formatDateShort(event.event_date)} · {formatTime(event.start_time)}
                                            </Text>
                                            {event.location ? (
                                                <Text
                                                    style={[styles.managerEventOwner, { color: typeColor }]}
                                                    numberOfLines={1}
                                                >
                                                    {event.location}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}

                {/* My Events — agent only */}
                {!isCandidate && !isPa && !isAdminRole && !isManagerView && (
                    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Events</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                                <Text style={[styles.seeAllText, { color: colors.accent }]}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {agentEvents.length === 0 ? (
                            <Text style={[styles.emptyActivityText, { color: colors.textTertiary }]}>
                                No upcoming events
                            </Text>
                        ) : (
                            agentEvents.map((event) => {
                                const typeColor = EVENT_TYPE_COLORS[event.event_type] ?? colors.accent;
                                return (
                                    <TouchableOpacity
                                        key={event.id}
                                        style={styles.managerEventRow}
                                        onPress={() => router.push(`/(tabs)/events/${event.id}`)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.managerEventStripe, { backgroundColor: typeColor }]} />
                                        <View style={styles.managerEventContent}>
                                            <Text
                                                style={[styles.managerEventTitle, { color: colors.textPrimary }]}
                                                numberOfLines={1}
                                            >
                                                {event.title}
                                            </Text>
                                            <Text style={[styles.managerEventMeta, { color: colors.textTertiary }]}>
                                                {formatDateShort(event.event_date)} · {formatTime(event.start_time)}
                                            </Text>
                                            {event.location ? (
                                                <Text
                                                    style={[styles.managerEventOwner, { color: typeColor }]}
                                                    numberOfLines={1}
                                                >
                                                    {event.location}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}

                {/* Lead Pipeline — hidden for candidates and PA */}
                {!isCandidate && !isPa && (
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lead Pipeline</Text>
                        <View style={[styles.pipelineWrapper, { backgroundColor: colors.borderLight }]}>
                            <View style={styles.pipelineBar}>
                                {pipeline
                                    .filter((s) => s.count > 0)
                                    .map((seg) => (
                                        <View
                                            key={seg.status}
                                            style={[
                                                styles.pipelineSegment,
                                                {
                                                    flex: seg.count / totalPipeline,
                                                    backgroundColor: STATUS_CONFIG[seg.status].color,
                                                },
                                            ]}
                                        />
                                    ))}
                            </View>
                        </View>
                        <View style={styles.pipelineLegend}>
                            {pipeline.map((seg) => {
                                if (seg.count === 0) return null;
                                return (
                                    <View
                                        key={seg.status}
                                        style={[styles.legendChip, { backgroundColor: colors.background }]}
                                    >
                                        <View
                                            style={[
                                                styles.legendDot,
                                                { backgroundColor: STATUS_CONFIG[seg.status].color },
                                            ]}
                                        />
                                        <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                                            {STATUS_CONFIG[seg.status].label}
                                        </Text>
                                        <Text style={[styles.legendCount, { color: colors.textPrimary }]}>
                                            {seg.count}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Recent Activity — hidden for candidates and PA */}
                {!isCandidate && !isPa && (
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary },
                        ]}
                    >
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/leads')}
                                accessibilityRole="button"
                                accessibilityLabel="See all recent activity"
                            >
                                <Text style={[styles.seeAllText, { color: colors.accent }]}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.activityFeed}>
                            {displayActivities.length === 0 ? (
                                <Text style={[styles.emptyActivityText, { color: colors.textTertiary }]}>
                                    No recent activity
                                </Text>
                            ) : (
                                displayActivities.map((activity) => (
                                    <View key={activity.id} style={styles.activityRow}>
                                        <View
                                            style={[styles.activityIconCircle, { backgroundColor: colors.accentLight }]}
                                        >
                                            <Ionicons name={activity.icon as any} size={18} color={colors.accent} />
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={[styles.activityLeadName, { color: colors.textPrimary }]}>
                                                {activity.leadName}
                                            </Text>
                                            <Text style={[styles.activityDetail, { color: colors.textSecondary }]}>
                                                {activity.detail}
                                            </Text>
                                        </View>
                                        <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
                                            {activity.time}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ── Biometrics Setup Prompt (one-time) ── */}
            <Modal
                visible={showBiometricsPrompt}
                transparent
                animationType="slide"
                onRequestClose={handleDismissBiometricsPrompt}
                accessibilityViewIsModal
            >
                <View style={styles.biometricOverlay}>
                    <View style={[styles.biometricSheet, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.biometricIconCircle, { backgroundColor: colors.accentLight }]}>
                            <Ionicons
                                name={biometryType === 'faceid' ? 'scan' : 'finger-print'}
                                size={40}
                                color={colors.accent}
                            />
                        </View>
                        <Text style={[styles.biometricTitle, { color: colors.textPrimary }]}>
                            Sign in with {biometryType === 'faceid' ? 'Face ID' : 'Touch ID'}
                        </Text>
                        <Text style={[styles.biometricSubtitle, { color: colors.textSecondary }]}>
                            Skip the OTP next time — use {biometryType === 'faceid' ? 'Face ID' : 'Touch ID'} to sign in
                            instantly.
                        </Text>
                        <TouchableOpacity
                            style={[styles.biometricEnableBtn, { backgroundColor: colors.accent }]}
                            onPress={handleEnableBiometrics}
                            disabled={isEnablingBiometrics}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel={`Enable ${biometryType === 'faceid' ? 'Face ID' : 'Touch ID'}`}
                        >
                            <Ionicons
                                name={biometryType === 'faceid' ? 'scan' : 'finger-print'}
                                size={20}
                                color="#FFFFFF"
                            />
                            <Text style={styles.biometricEnableBtnText}>
                                Enable {biometryType === 'faceid' ? 'Face ID' : 'Touch ID'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.biometricDismissBtn}
                            onPress={handleDismissBiometricsPrompt}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel="Not now"
                        >
                            <Text style={[styles.biometricDismissText, { color: colors.textTertiary }]}>Not Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ── Sub-Components ──

const StatCardSmall = memo(function StatCardSmall({
    label,
    value,
    colors,
}: {
    label: string;
    value: string;
    colors: any;
}) {
    return (
        <View
            style={[styles.statCardSmall, { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary }]}
        >
            <Text style={[styles.statValueSmall, { color: colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.statLabelSmall, { color: colors.textTertiary }]}>{label}</Text>
        </View>
    );
});

const QuickActionBtn = memo(function QuickActionBtn({
    icon,
    label,
    colors,
    onPress,
}: {
    icon: string;
    label: string;
    colors: any;
    onPress: () => void;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const onPressIn = () => {
        scale.value = withSpring(0.97, { damping: 15 });
    };
    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 15 });
    };

    return (
        <TouchableOpacity
            style={[
                styles.quickActionSurface,
                { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary },
            ]}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Animated.View style={[styles.quickActionInner, animatedStyle]}>
                <View style={[styles.quickActionIconWrapper, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name={icon as any} size={22} color={colors.accent} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

// ── Styles ──
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40, paddingTop: 4 },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    greetingText: { fontSize: 15, fontWeight: '400' },
    viewModeToggle: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    viewModeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    viewModeBtnText: { fontSize: 12 },

    // Header
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    bellBtn: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarBtn: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 0,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
    },

    // Shared Section Styles
    section: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    seeAllText: { fontSize: 14, fontWeight: '600' },

    // Card Standard
    card: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },

    // Hero Stats (Staggered Layout)
    heroStatsContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    heroCardPrimary: {
        flex: 1.2,
        borderRadius: 24,
        padding: 20,
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 160,
    },
    heroIconBg: {
        position: 'absolute',
        top: -10,
        right: -10,
        transform: [{ rotate: '15deg' }],
    },
    heroStatValue: { fontSize: 40, fontWeight: '800', marginBottom: 4, letterSpacing: -1 },
    heroStatLabel: { fontSize: 15, fontWeight: '500' },

    statsColumn: {
        flex: 1,
        gap: 12,
    },
    statCardSmall: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    statValueSmall: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
    statLabelSmall: { fontSize: 13, fontWeight: '500' },

    // Quick Actions
    quickActionsSection: {
        marginTop: 4,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionSurface: {
        flex: 1,
        minWidth: '45%',
        borderRadius: 16,
        alignItems: 'center',
        paddingVertical: 14,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    quickActionIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionInner: {
        alignItems: 'center',
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Pipeline
    pipelineWrapper: {
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
    },
    pipelineBar: {
        flexDirection: 'row',
        height: 12,
        borderRadius: 8,
        overflow: 'hidden',
        gap: 2,
    },
    pipelineSegment: { borderRadius: 8 },
    pipelineLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    legendChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendLabel: { fontSize: 12, fontWeight: '500' },
    legendCount: { fontSize: 13, fontWeight: '700' },

    // Activity Feed
    activityFeed: {
        gap: 16,
    },
    emptyActivityText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activityIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: { flex: 1 },
    activityLeadName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    activityDetail: { fontSize: 13, fontWeight: '400' },
    activityTime: { fontSize: 12, alignSelf: 'flex-start', marginTop: 2 },

    // Manager Schedule (PA view)
    managerEventRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginBottom: 14 },
    managerEventStripe: { width: 4, borderRadius: 2 },
    managerEventContent: { flex: 1 },
    managerEventTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    managerEventMeta: { fontSize: 12, marginBottom: 2 },
    managerEventOwner: { fontSize: 12, fontWeight: '600' },

    // Biometrics prompt sheet
    biometricOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    biometricSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 32,
        paddingBottom: 48,
        alignItems: 'center',
    },
    biometricIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    biometricTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    biometricSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    biometricEnableBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        height: 52,
        borderRadius: 14,
        marginBottom: 12,
    },
    biometricEnableBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    biometricDismissBtn: {
        padding: 12,
    },
    biometricDismissText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
