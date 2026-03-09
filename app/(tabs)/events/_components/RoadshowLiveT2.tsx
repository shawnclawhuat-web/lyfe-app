import Avatar from '@/components/Avatar';
import ProgressRing from '@/components/events/ProgressRing';
import { ERROR_BG, ERROR_TEXT, getAvatarColor, ROADSHOW_PINK } from '@/constants/ui';
import { formatCheckinTime } from '@/lib/dateTime';
import type { AgencyEvent, EventAttendee, RoadshowAttendance, RoadshowConfig } from '@/types/event';
import type { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityCounts {
    sitdowns: number;
    pitches: number;
    closed: number;
    afyc: number;
}

interface BoothTotals {
    sitdowns: number;
    pitches: number;
    closed: number;
    afyc: number;
    pledgedSitdowns: number;
    pledgedPitches: number;
    pledgedClosed: number;
    pledgedAfyc: number;
}

export interface RoadshowLiveT2Props {
    colors: typeof Colors.light;
    event: AgencyEvent;
    attendance: RoadshowAttendance[];
    activityCounts: (userId: string) => ActivityCounts;
    boothTotals: BoothTotals;
    roadshowConfig: RoadshowConfig | null;
    // Manager override
    overrideTarget: EventAttendee | null;
    setOverrideTarget: (v: EventAttendee | null) => void;
    overrideTime: string;
    setOverrideTime: (v: string) => void;
    overrideLateReason: string;
    setOverrideLateReason: (v: string) => void;
    overridePledgeSitdowns: number;
    setOverridePledgeSitdowns: React.Dispatch<React.SetStateAction<number>>;
    overridePledgePitches: number;
    setOverridePledgePitches: React.Dispatch<React.SetStateAction<number>>;
    overridePledgeClosed: number;
    setOverridePledgeClosed: React.Dispatch<React.SetStateAction<number>>;
    overridePledgeAfyc: string;
    setOverridePledgeAfyc: (v: string) => void;
    overrideSubmitting: boolean;
    overrideError: string | null;
    openOverride: (agent: EventAttendee) => void;
    handleConfirmOverride: () => void;
    userFullName: string | undefined;
}

function RoadshowLiveT2Inner(props: RoadshowLiveT2Props) {
    const {
        colors,
        event,
        attendance,
        activityCounts,
        boothTotals,
        roadshowConfig,
        overrideTarget,
        setOverrideTarget,
        overrideTime,
        setOverrideTime,
        overrideLateReason,
        setOverrideLateReason,
        overridePledgeSitdowns,
        setOverridePledgeSitdowns,
        overridePledgePitches,
        setOverridePledgePitches,
        overridePledgeClosed,
        setOverridePledgeClosed,
        overridePledgeAfyc,
        setOverridePledgeAfyc,
        overrideSubmitting,
        overrideError,
        openOverride,
        handleConfirmOverride,
        userFullName,
    } = props;

    return (
        <>
            {/* Booth Totals */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Booth Totals</Text>
                {roadshowConfig && (
                    <Text style={[styles.boothCostLabel, { color: colors.textTertiary }]}>
                        Cost today: ${roadshowConfig.daily_cost.toFixed(2)} ({roadshowConfig.slots_per_day} × $
                        {roadshowConfig.slot_cost.toFixed(2)})
                    </Text>
                )}
                <View style={styles.ringsRow}>
                    <ProgressRing
                        actual={boothTotals.sitdowns}
                        pledged={boothTotals.pledgedSitdowns}
                        color="#6366F1"
                        label="Sitdowns"
                        accessLabel={`Booth sitdowns: ${boothTotals.sitdowns} of ${boothTotals.pledgedSitdowns}`}
                    />
                    <ProgressRing
                        actual={boothTotals.pitches}
                        pledged={boothTotals.pledgedPitches}
                        color="#E67700"
                        label="Pitches"
                        accessLabel={`Booth pitches: ${boothTotals.pitches} of ${boothTotals.pledgedPitches}`}
                    />
                    <ProgressRing
                        actual={boothTotals.closed}
                        pledged={boothTotals.pledgedClosed}
                        color="#F59E0B"
                        label="Closed"
                        accessLabel={`Booth cases: ${boothTotals.closed} of ${boothTotals.pledgedClosed}`}
                    />
                </View>
                <View style={styles.afycSection}>
                    <View style={styles.afycRow}>
                        <Text style={[styles.afycLabel, { color: colors.textSecondary }]}>AFYC</Text>
                        <Text style={[styles.afycValue, { color: colors.textPrimary }]}>
                            ${boothTotals.afyc.toLocaleString()}
                            {boothTotals.pledgedAfyc > 0 && (
                                <Text style={{ color: colors.textTertiary }}>
                                    {' '}
                                    of ${boothTotals.pledgedAfyc.toLocaleString()} pledged
                                </Text>
                            )}
                        </Text>
                    </View>
                    {boothTotals.pledgedAfyc > 0 && (
                        <View style={[styles.afycTrack, { backgroundColor: colors.surfaceSecondary }]}>
                            <View
                                style={[
                                    styles.afycFill,
                                    {
                                        width: `${Math.min(100, (boothTotals.afyc / boothTotals.pledgedAfyc) * 100)}%` as any,
                                        backgroundColor: '#F59E0B',
                                    },
                                ]}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* Agent Status */}
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Agent Status</Text>
                    <Text style={[styles.countBadge, { color: colors.textTertiary }]}>
                        {attendance.length} / {event.attendees.length}
                    </Text>
                </View>
                {event.attendees.map((agent) => {
                    const att = attendance.find((a) => a.user_id === agent.user_id);
                    const counts = activityCounts(agent.user_id);
                    const ac = getAvatarColor(agent.full_name ?? '?');
                    return (
                        <View key={agent.id} style={[styles.agentCard, { backgroundColor: colors.surfaceSecondary }]}>
                            <View style={styles.agentHeader}>
                                <Avatar
                                    name={agent.full_name ?? '?'}
                                    avatarUrl={null}
                                    size={32}
                                    backgroundColor={ac + '18'}
                                    textColor={ac}
                                />
                                <Text style={[styles.agentName, { color: colors.textPrimary }]}>{agent.full_name}</Text>
                                {!att && (
                                    <TouchableOpacity
                                        style={[styles.overrideBtn, { borderColor: ROADSHOW_PINK }]}
                                        onPress={() => openOverride(agent)}
                                        accessibilityLabel={`Check in ${agent.full_name}`}
                                    >
                                        <Ionicons name="add" size={16} color={ROADSHOW_PINK} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {att ? (
                                <>
                                    <View style={styles.agentCheckinRow}>
                                        <Ionicons
                                            name={att.is_late ? 'warning' : 'checkmark-circle'}
                                            size={14}
                                            color={att.is_late ? colors.warning : colors.accent}
                                        />
                                        <Text
                                            style={{
                                                color: att.is_late ? colors.warning : colors.accent,
                                                fontSize: 13,
                                            }}
                                        >
                                            {formatCheckinTime(att.checked_in_at)} ·{' '}
                                            {att.is_late ? `Late ${att.minutes_late} min` : 'On time'}
                                        </Text>
                                        {att.checked_in_by && (
                                            <Text style={{ color: colors.textTertiary, fontSize: 11 }}>(override)</Text>
                                        )}
                                    </View>
                                    {att.late_reason && (
                                        <Text
                                            style={{
                                                color: colors.textTertiary,
                                                fontSize: 12,
                                                marginTop: 2,
                                                marginLeft: 18,
                                            }}
                                        >
                                            "{att.late_reason}"
                                        </Text>
                                    )}
                                    <View style={[styles.agentStatsTable, { marginTop: 10 }]}>
                                        <View
                                            style={[
                                                styles.agentStatsBand,
                                                {
                                                    borderColor: colors.border,
                                                    backgroundColor: colors.surfaceSecondary,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.agentBandLabel, { color: colors.textTertiary }]}>
                                                TARGET
                                            </Text>
                                            <View style={styles.agentBandRow}>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[styles.agentBandNum, { color: colors.textSecondary }]}
                                                    >
                                                        {att.pledged_sitdowns}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Sitdowns</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[styles.agentBandNum, { color: colors.textSecondary }]}
                                                    >
                                                        {att.pledged_pitches}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Pitches</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[styles.agentBandNum, { color: colors.textSecondary }]}
                                                    >
                                                        {att.pledged_closed}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Cases</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[styles.agentBandNum, { color: colors.textSecondary }]}
                                                    >
                                                        $
                                                        {att.pledged_afyc >= 1000
                                                            ? `${(att.pledged_afyc / 1000).toFixed(0)}k`
                                                            : att.pledged_afyc > 0
                                                              ? att.pledged_afyc
                                                              : '\u2014'}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>AFYC</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.agentStatsBand}>
                                            <Text style={[styles.agentBandLabel, { color: colors.textSecondary }]}>
                                                ACTUAL
                                            </Text>
                                            <View style={styles.agentBandRow}>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[
                                                            styles.agentActualNum,
                                                            {
                                                                color:
                                                                    counts.sitdowns >= att.pledged_sitdowns &&
                                                                    att.pledged_sitdowns > 0
                                                                        ? '#E67700'
                                                                        : colors.textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        {counts.sitdowns}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Sitdowns</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[
                                                            styles.agentActualNum,
                                                            {
                                                                color:
                                                                    counts.pitches >= att.pledged_pitches &&
                                                                    att.pledged_pitches > 0
                                                                        ? '#E67700'
                                                                        : colors.textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        {counts.pitches}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Pitches</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[
                                                            styles.agentActualNum,
                                                            {
                                                                color:
                                                                    counts.closed >= att.pledged_closed &&
                                                                    att.pledged_closed > 0
                                                                        ? '#E67700'
                                                                        : colors.textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        {counts.closed}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>Cases</Text>
                                                </View>
                                                <View style={styles.agentBandCol}>
                                                    <Text
                                                        style={[
                                                            styles.agentActualNum,
                                                            {
                                                                color:
                                                                    counts.afyc >= att.pledged_afyc &&
                                                                    att.pledged_afyc > 0
                                                                        ? '#F59E0B'
                                                                        : colors.textPrimary,
                                                            },
                                                        ]}
                                                    >
                                                        $
                                                        {counts.afyc >= 1000
                                                            ? `${(counts.afyc / 1000).toFixed(0)}k`
                                                            : counts.afyc}
                                                    </Text>
                                                    <Text style={styles.agentBandCaption}>AFYC</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.agentCheckinRow}>
                                    <Ionicons name="remove-circle-outline" size={14} color={colors.textTertiary} />
                                    <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Not checked in</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* ── Manager Override Sheet ── */}
            <Modal
                visible={!!overrideTarget}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setOverrideTarget(null)}
            >
                <SafeAreaView style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                                Check in for {overrideTarget?.full_name}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setOverrideTarget(null)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.sheetContent}>
                            <Text style={{ color: colors.textTertiary, fontSize: 12, marginBottom: 16 }}>
                                Recorded as override by {userFullName}
                            </Text>
                            <View style={styles.field}>
                                <Text style={[styles.pledgeLabel, { color: colors.textSecondary }]}>Arrival time</Text>
                                <TextInput
                                    style={[
                                        styles.inputSm,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: colors.inputBorder,
                                            color: colors.textPrimary,
                                        },
                                    ]}
                                    placeholder="e.g. 10:15 AM"
                                    placeholderTextColor={colors.textTertiary}
                                    value={overrideTime}
                                    onChangeText={setOverrideTime}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={[styles.pledgeLabel, { color: colors.textSecondary }]}>
                                    Late reason (optional)
                                </Text>
                                <TextInput
                                    style={[
                                        styles.inputSm,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: colors.inputBorder,
                                            color: colors.textPrimary,
                                        },
                                    ]}
                                    placeholder="e.g. MRT delay"
                                    placeholderTextColor={colors.textTertiary}
                                    value={overrideLateReason}
                                    onChangeText={setOverrideLateReason}
                                />
                            </View>
                            <Text
                                style={[
                                    {
                                        color: colors.textSecondary,
                                        fontSize: 13,
                                        fontWeight: '600',
                                        marginBottom: 8,
                                    },
                                ]}
                            >
                                Pledge on their behalf
                            </Text>
                            {(
                                [
                                    ['Sitdowns', overridePledgeSitdowns, setOverridePledgeSitdowns],
                                    ['Pitches', overridePledgePitches, setOverridePledgePitches],
                                    ['Cases', overridePledgeClosed, setOverridePledgeClosed],
                                ] as any[]
                            ).map(([label, val, setter]) => (
                                <View key={label} style={styles.pledgeRow}>
                                    <Text style={[styles.pledgeLabel, { color: colors.textSecondary }]}>{label}</Text>
                                    <View style={styles.pledgeStepperRow}>
                                        <TouchableOpacity
                                            style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}
                                            onPress={() => setter((v: number) => Math.max(0, v - 1))}
                                        >
                                            <Ionicons name="remove" size={18} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                        <Text style={[styles.stepVal, { color: colors.textPrimary }]}>{val}</Text>
                                        <TouchableOpacity
                                            style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}
                                            onPress={() => setter((v: number) => v + 1)}
                                        >
                                            <Ionicons name="add" size={18} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <View style={styles.field}>
                                <Text style={[styles.pledgeLabel, { color: colors.textSecondary }]}>
                                    AFYC target ($)
                                </Text>
                                <TextInput
                                    style={[
                                        styles.inputSm,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: colors.inputBorder,
                                            color: colors.textPrimary,
                                        },
                                    ]}
                                    placeholder="e.g. 2000"
                                    placeholderTextColor={colors.textTertiary}
                                    value={overridePledgeAfyc}
                                    onChangeText={(v) => setOverridePledgeAfyc(v.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                />
                            </View>
                            {overrideError && (
                                <View style={[styles.errorBanner, { backgroundColor: ERROR_BG }]}>
                                    <Text style={{ color: ERROR_TEXT, fontSize: 13 }}>{overrideError}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.checkinBtn,
                                    { backgroundColor: ROADSHOW_PINK, opacity: overrideSubmitting ? 0.6 : 1 },
                                ]}
                                onPress={handleConfirmOverride}
                                disabled={overrideSubmitting}
                            >
                                {overrideSubmitting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.checkinBtnText}>Confirm Override Check-in</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </>
    );
}

export const RoadshowLiveT2 = React.memo(RoadshowLiveT2Inner);

const styles = StyleSheet.create({
    card: { borderRadius: 16, padding: 16, gap: 12 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    field: { gap: 4 },
    inputSm: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    sheetContainer: { flex: 1 },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetTitle: { fontSize: 17, fontWeight: '700' },
    sheetContent: { padding: 16, gap: 12 },

    ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    boothCostLabel: { fontSize: 13 },

    afycSection: { gap: 6 },
    afycRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    afycLabel: { fontSize: 14, fontWeight: '600' },
    afycValue: { fontSize: 14, fontWeight: '700' },
    afycTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    afycFill: { height: 6, borderRadius: 3 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    countBadge: { fontSize: 13, fontWeight: '600' },

    agentCard: { borderRadius: 12, padding: 12, gap: 6 },
    agentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    agentName: { flex: 1, fontSize: 15, fontWeight: '600' },
    agentCheckinRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    agentStatsTable: { gap: 8 },
    agentStatsBand: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    agentBandLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    agentBandRow: { flexDirection: 'row' },
    agentBandCol: { flex: 1, alignItems: 'center', gap: 2 },
    agentBandNum: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
    agentBandCaption: { fontSize: 10, color: '#8E8E93', textAlign: 'center' },
    agentActualNum: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    overrideBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },

    errorBanner: { borderRadius: 8, padding: 10 },
    checkinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 14,
        paddingVertical: 15,
        minHeight: 52,
    },
    checkinBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    pledgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pledgeLabel: { fontSize: 15, fontWeight: '500' },
    pledgeStepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    stepVal: { fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center' },
});
