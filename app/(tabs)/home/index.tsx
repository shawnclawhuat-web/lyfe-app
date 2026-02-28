import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { STATUS_CONFIG, type LeadStatus } from '@/types/lead';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ── Mock Data ──
const MOCK_STATS = {
    totalLeads: 8,
    newThisWeek: 3,
    conversionRate: 25,
    activeFollowUps: 4,
};

const MOCK_ACTIVITIES = [
    { id: '1', type: 'status_change' as const, leadName: 'Sarah Tan', detail: 'New → Contacted', time: '2h ago', icon: 'swap-horizontal' as const },
    { id: '2', type: 'note' as const, leadName: 'David Lim', detail: 'Added follow-up note', time: '3h ago', icon: 'create' as const },
    { id: '3', type: 'call' as const, leadName: 'Amanda Lee', detail: 'Outbound call (5 min)', time: '5h ago', icon: 'call' as const },
    { id: '4', type: 'new_lead' as const, leadName: 'Michael Wong', detail: 'New lead from referral', time: '1d ago', icon: 'person-add' as const },
    { id: '5', type: 'status_change' as const, leadName: 'Jessica Ng', detail: 'Proposed → Won 🎉', time: '2d ago', icon: 'trophy' as const },
];

const LEAD_PIPELINE: { status: LeadStatus; count: number }[] = [
    { status: 'new', count: 2 },
    { status: 'contacted', count: 2 },
    { status: 'qualified', count: 1 },
    { status: 'proposed', count: 2 },
    { status: 'won', count: 1 },
    { status: 'lost', count: 0 },
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const greeting = useMemo(() => getGreeting(), []);
    const firstName = user?.full_name?.split(' ')[0] || 'there';

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const totalPipeline = LEAD_PIPELINE.reduce((n, s) => n + s.count, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting},</Text>
                        <Text style={[styles.name, { color: colors.textPrimary }]}>{firstName} 👋</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.avatarCircle, { backgroundColor: colors.accentLight }]}
                        onPress={() => router.push('/(tabs)/profile' as any)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.avatarText, { color: colors.accent }]}>
                            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="Total Leads"
                        value={MOCK_STATS.totalLeads.toString()}
                        icon="people"
                        color={colors.info}
                        bgColor={colors.infoLight}
                        colors={colors}
                    />
                    <StatCard
                        label="New This Week"
                        value={MOCK_STATS.newThisWeek.toString()}
                        icon="trending-up"
                        color={colors.success}
                        bgColor={colors.successLight}
                        colors={colors}
                    />
                    <StatCard
                        label="Conversion"
                        value={`${MOCK_STATS.conversionRate}%`}
                        icon="analytics"
                        color={colors.accent}
                        bgColor={colors.accentLight}
                        colors={colors}
                    />
                    <StatCard
                        label="Follow-ups"
                        value={MOCK_STATS.activeFollowUps.toString()}
                        icon="alarm"
                        color={colors.warning}
                        bgColor={colors.warningLight}
                        colors={colors}
                    />
                </View>

                {/* Quick Actions */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                    <View style={styles.quickActionsRow}>
                        <QuickActionBtn
                            icon="person-add"
                            label="Add Lead"
                            color={colors.accent}
                            bgColor={colors.accentLight}
                            onPress={() => router.push('/(tabs)/leads/add' as any)}
                        />
                        <QuickActionBtn
                            icon="school"
                            label="Take Exam"
                            color={colors.info}
                            bgColor={colors.infoLight}
                            onPress={() => router.push('/(tabs)/exams' as any)}
                        />
                        <QuickActionBtn
                            icon="list"
                            label="All Leads"
                            color={colors.success}
                            bgColor={colors.successLight}
                            onPress={() => router.push('/(tabs)/leads' as any)}
                        />
                        <QuickActionBtn
                            icon="person"
                            label="Profile"
                            color={colors.warning}
                            bgColor={colors.warningLight}
                            onPress={() => router.push('/(tabs)/profile' as any)}
                        />
                    </View>
                </View>

                {/* Lead Pipeline */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Lead Pipeline</Text>
                    <View style={styles.pipelineBar}>
                        {LEAD_PIPELINE.filter(s => s.count > 0).map((seg) => (
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
                    <View style={styles.pipelineLegend}>
                        {LEAD_PIPELINE.map((seg) => (
                            <View key={seg.status} style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: STATUS_CONFIG[seg.status].color }]} />
                                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                                    {STATUS_CONFIG[seg.status].label}
                                </Text>
                                <Text style={[styles.legendCount, { color: colors.textPrimary }]}>{seg.count}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                    {MOCK_ACTIVITIES.map((activity, index) => (
                        <View
                            key={activity.id}
                            style={[
                                styles.activityRow,
                                index < MOCK_ACTIVITIES.length - 1 && { borderBottomColor: colors.borderLight, borderBottomWidth: 0.5 },
                            ]}
                        >
                            <View style={[styles.activityIcon, { backgroundColor: colors.surfacePrimary }]}>
                                <Ionicons name={activity.icon as any} size={16} color={colors.accent} />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={[styles.activityLeadName, { color: colors.textPrimary }]}>{activity.leadName}</Text>
                                <Text style={[styles.activityDetail, { color: colors.textSecondary }]}>{activity.detail}</Text>
                            </View>
                            <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{activity.time}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Sub-Components ──

function StatCard({ label, value, icon, color, bgColor, colors }: {
    label: string; value: string; icon: string; color: string; bgColor: string; colors: any;
}) {
    return (
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
}

function QuickActionBtn({ icon, label, color, bgColor, onPress }: {
    icon: string; label: string; color: string; bgColor: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.quickActionBtn} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={22} color={color} />
            </View>
            <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ── Styles ──
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 32 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    greeting: { fontSize: 14, fontWeight: '500', letterSpacing: 0.2 },
    name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700' },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        gap: 8,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 14,
        gap: 6,
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { fontSize: 12, fontWeight: '500' },

    // Cards
    card: {
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 16,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },

    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    quickActionBtn: {
        alignItems: 'center',
        gap: 6,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: { fontSize: 11, fontWeight: '600' },

    // Pipeline
    pipelineBar: {
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        gap: 2,
        marginBottom: 14,
    },
    pipelineSegment: {
        borderRadius: 5,
    },
    pipelineLegend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: { fontSize: 11 },
    legendCount: { fontSize: 11, fontWeight: '700' },

    // Activity
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 10,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: { flex: 1 },
    activityLeadName: { fontSize: 13, fontWeight: '600' },
    activityDetail: { fontSize: 12, marginTop: 1 },
    activityTime: { fontSize: 11 },
});
