import ProgressRing from '@/components/events/ProgressRing';
import WheelPicker from '@/components/WheelPicker';
import { formatCheckinTime, formatTime } from '@/lib/dateTime';
import { ERROR_BG, ERROR_TEXT, PICKER_HOURS, PICKER_MINUTES, PICKER_AMPM, ROADSHOW_PINK } from '@/constants/ui';
import type { RoadshowActivity, RoadshowAttendance, RoadshowConfig } from '@/types/event';
import type { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

interface MyCounts {
    sitdowns: number;
    pitches: number;
    closed: number;
    afyc: number;
}

export interface RoadshowLiveT1Props {
    colors: typeof Colors.light;
    attendance: RoadshowAttendance[];
    myAttendance: RoadshowAttendance | null;
    myCounts: MyCounts;
    roadshowConfig: RoadshowConfig | null;
    activities: RoadshowActivity[];
    isCurrentlyLate: boolean;
    minutesCurrentlyLate: number;
    insets: EdgeInsets;
    userId: string | undefined;
    // Check-in flow
    lateReason: string;
    setLateReason: (v: string) => void;
    showPledgeSheet: boolean;
    setShowPledgeSheet: (v: boolean) => void;
    pledgeSitdowns: number;
    setPledgeSitdowns: React.Dispatch<React.SetStateAction<number>>;
    pledgePitches: number;
    setPledgePitches: React.Dispatch<React.SetStateAction<number>>;
    pledgeClosed: number;
    setPledgeClosed: React.Dispatch<React.SetStateAction<number>>;
    pledgeAfyc: string;
    setPledgeAfyc: (v: string) => void;
    checkingIn: boolean;
    checkinError: string | null;
    handleOpenCheckin: () => void;
    handleConfirmPledge: () => void;
    // Activity log
    logDebounce: Record<string, boolean>;
    confirmActivity: 'sitdown' | 'pitch' | null;
    setConfirmActivity: (v: 'sitdown' | 'pitch' | null) => void;
    showAfycSheet: boolean;
    setShowAfycSheet: (v: boolean) => void;
    afycInput: string;
    setAfycInput: (v: string) => void;
    loggingActivity: boolean;
    logHour: number;
    setLogHour: (v: number) => void;
    logMinuteIdx: number;
    setLogMinuteIdx: (v: number) => void;
    logAmPm: number;
    setLogAmPm: (v: number) => void;
    initLogTime: () => void;
    handleLogActivity: (type: 'sitdown' | 'pitch') => void;
    handleLogCaseClosed: () => void;
    handleLogDeparture: () => void;
    handleReturnToBooth: () => void;
    hasCheckedIn: boolean;
}

function RoadshowLiveT1Inner(props: RoadshowLiveT1Props) {
    const {
        colors,
        attendance,
        myAttendance,
        myCounts,
        roadshowConfig,
        activities,
        isCurrentlyLate,
        minutesCurrentlyLate,
        insets,
        userId,
        lateReason,
        setLateReason,
        showPledgeSheet,
        setShowPledgeSheet,
        pledgeSitdowns,
        setPledgeSitdowns,
        pledgePitches,
        setPledgePitches,
        pledgeClosed,
        setPledgeClosed,
        pledgeAfyc,
        setPledgeAfyc,
        checkingIn,
        checkinError,
        handleOpenCheckin,
        handleConfirmPledge,
        logDebounce,
        confirmActivity,
        setConfirmActivity,
        showAfycSheet,
        setShowAfycSheet,
        afycInput,
        setAfycInput,
        loggingActivity,
        logHour,
        setLogHour,
        logMinuteIdx,
        setLogMinuteIdx,
        logAmPm,
        setLogAmPm,
        initLogTime,
        handleLogActivity,
        handleLogCaseClosed,
        handleLogDeparture,
        handleReturnToBooth,
        hasCheckedIn,
    } = props;

    // ---- Check-in CTA ----
    const renderCheckIn = () => {
        const checkedInByManager = attendance.find((a) => a.user_id === userId && a.checked_in_by);

        if (checkedInByManager) {
            return (
                <View style={[styles.infoBanner, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                    <Ionicons name="information-circle" size={16} color={colors.info} />
                    <Text style={{ color: colors.info, fontSize: 13, flex: 1 }}>
                        You were checked in by your manager at {formatCheckinTime(checkedInByManager.checked_in_at)}.
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.boothInfoRow}>
                    <Ionicons name="storefront-outline" size={16} color={ROADSHOW_PINK} />
                    <Text style={[styles.boothInfoText, { color: colors.textSecondary }]}>
                        Booth opens {roadshowConfig ? formatTime(roadshowConfig.expected_start_time) : '--'}
                        {roadshowConfig ? ` \u00B7 ${roadshowConfig.late_grace_minutes} min grace` : ''}
                    </Text>
                </View>
                {roadshowConfig && (
                    <Text style={[styles.slotCostText, { color: colors.textTertiary }]}>
                        Your slot cost today: ${roadshowConfig.slot_cost.toFixed(2)}
                    </Text>
                )}

                {isCurrentlyLate && (
                    <View
                        style={[
                            styles.lateBanner,
                            { backgroundColor: colors.warningLight, borderColor: colors.warning },
                        ]}
                    >
                        <Ionicons name="warning" size={14} color={colors.warning} />
                        <Text style={[styles.lateText, { color: colors.warning }]}>
                            {formatCheckinTime(new Date().toISOString())} — {minutesCurrentlyLate} min late
                        </Text>
                    </View>
                )}

                {isCurrentlyLate && (
                    <View style={styles.field}>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
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
                            value={lateReason}
                            onChangeText={setLateReason}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.checkinBtn, { backgroundColor: isCurrentlyLate ? colors.warning : colors.accent }]}
                    onPress={handleOpenCheckin}
                    accessibilityLabel={isCurrentlyLate ? 'Mark Attendance Late' : 'Check In Now'}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.checkinBtnText}>
                        {isCurrentlyLate ? 'Mark Attendance (Late)' : 'Check In Now'}
                    </Text>
                </TouchableOpacity>

                {checkinError && (
                    <View style={[styles.errorBanner, { backgroundColor: ERROR_BG }]}>
                        <Text style={{ color: ERROR_TEXT, fontSize: 13 }}>{checkinError}</Text>
                    </View>
                )}
            </View>
        );
    };

    // ---- Progress ----
    const renderProgress = () => (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.progressHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Your Progress</Text>
                {myAttendance && (
                    <Text style={[styles.checkinLabel, { color: colors.textTertiary }]}>
                        In since {formatCheckinTime(myAttendance.checked_in_at)}
                    </Text>
                )}
            </View>
            <View style={styles.ringsRow}>
                <ProgressRing
                    actual={myCounts.sitdowns}
                    pledged={myAttendance?.pledged_sitdowns ?? 0}
                    color="#6366F1"
                    label="Sitdowns"
                    accessLabel={`Sitdowns: ${myCounts.sitdowns} of ${myAttendance?.pledged_sitdowns ?? 0}`}
                />
                <ProgressRing
                    actual={myCounts.pitches}
                    pledged={myAttendance?.pledged_pitches ?? 0}
                    color="#E67700"
                    label="Pitches"
                    accessLabel={`Pitches: ${myCounts.pitches} of ${myAttendance?.pledged_pitches ?? 0}`}
                />
                <ProgressRing
                    actual={myCounts.closed}
                    pledged={myAttendance?.pledged_closed ?? 0}
                    color="#F59E0B"
                    label="Closed"
                    accessLabel={`Cases Closed: ${myCounts.closed} of ${myAttendance?.pledged_closed ?? 0}`}
                />
            </View>

            <View style={styles.afycSection}>
                <View style={styles.afycRow}>
                    <Text style={[styles.afycLabel, { color: colors.textSecondary }]}>AFYC</Text>
                    <Text style={[styles.afycValue, { color: colors.textPrimary }]}>
                        ${myCounts.afyc.toLocaleString()}
                        {(myAttendance?.pledged_afyc ?? 0) > 0 && (
                            <Text style={{ color: colors.textTertiary }}>
                                {' '}
                                of ${(myAttendance?.pledged_afyc ?? 0).toLocaleString()} pledged
                            </Text>
                        )}
                    </Text>
                </View>
                {(myAttendance?.pledged_afyc ?? 0) > 0 && (
                    <View style={[styles.afycTrack, { backgroundColor: colors.surfaceSecondary }]}>
                        <View
                            style={[
                                styles.afycFill,
                                {
                                    width: `${Math.min(100, (myCounts.afyc / (myAttendance?.pledged_afyc ?? 1)) * 100)}%` as any,
                                    backgroundColor: '#F59E0B',
                                },
                            ]}
                        />
                    </View>
                )}
            </View>
        </View>
    );

    // ---- Log Activity ----
    const renderLogActivity = () => {
        const lastCheckinOrDep = activities
            .filter((a) => a.user_id === userId && (a.type === 'check_in' || a.type === 'departure'))
            .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];
        const hasDeparted = lastCheckinOrDep?.type === 'departure';

        return (
            <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.logHeaderRow}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Log Activity</Text>
                    <Text style={[styles.logHint, { color: colors.textTertiary }]}>Tap to record</Text>
                </View>
                <View style={[styles.stickyRow, hasDeparted && { opacity: 0.35 }]}>
                    <TouchableOpacity
                        style={[styles.logBtnLg, { backgroundColor: '#6366F118', borderColor: '#6366F1' }]}
                        onPress={() => {
                            initLogTime();
                            setConfirmActivity('sitdown');
                        }}
                        disabled={!!logDebounce['sitdown'] || hasDeparted}
                        activeOpacity={0.7}
                        accessibilityLabel={`Log Sitdown, current count ${myCounts.sitdowns}`}
                    >
                        <Ionicons name="people-outline" size={26} color="#6366F1" />
                        <Text style={[styles.logBtnLgLabel, { color: '#6366F1' }]}>Sitdown</Text>
                        <View style={[styles.logBtnBadge, { backgroundColor: '#6366F1' }]}>
                            <Text style={styles.logBtnBadgeText}>{myCounts.sitdowns}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.logBtnLg, { backgroundColor: '#E6770018', borderColor: '#E67700' }]}
                        onPress={() => {
                            initLogTime();
                            setConfirmActivity('pitch');
                        }}
                        disabled={!!logDebounce['pitch'] || hasDeparted}
                        activeOpacity={0.7}
                        accessibilityLabel={`Log Pitch, current count ${myCounts.pitches}`}
                    >
                        <Ionicons name="megaphone-outline" size={26} color="#E67700" />
                        <Text style={[styles.logBtnLgLabel, { color: '#E67700' }]}>Pitch</Text>
                        <View style={[styles.logBtnBadge, { backgroundColor: '#E67700' }]}>
                            <Text style={styles.logBtnBadgeText}>{myCounts.pitches}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.caseClosedBtn, { backgroundColor: '#F59E0B', opacity: hasDeparted ? 0.35 : 1 }]}
                    onPress={() => {
                        setAfycInput('');
                        initLogTime();
                        setShowAfycSheet(true);
                    }}
                    disabled={hasDeparted}
                    activeOpacity={0.75}
                    accessibilityLabel={`Log Case Closed, current count ${myCounts.closed}`}
                >
                    <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.caseClosedText}>Case Closed</Text>
                    <View style={[styles.logBtnBadge, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                        <Text style={styles.logBtnBadgeText}>{myCounts.closed}</Text>
                    </View>
                </TouchableOpacity>
                {!hasDeparted && (
                    <TouchableOpacity
                        style={[styles.leaveBtn, { borderColor: colors.border }]}
                        onPress={handleLogDeparture}
                        activeOpacity={0.7}
                        accessibilityLabel="Leave Roadshow"
                    >
                        <Ionicons name="log-out-outline" size={16} color={colors.textTertiary} />
                        <Text style={[styles.leaveBtnText, { color: colors.textTertiary }]}>Leave Roadshow</Text>
                    </TouchableOpacity>
                )}
                {hasDeparted && (
                    <View style={{ gap: 8 }}>
                        <View style={styles.departedBadge}>
                            <Ionicons name="walk-outline" size={14} color={colors.textTertiary} />
                            <Text style={[styles.leaveBtnText, { color: colors.textTertiary }]}>
                                You left the booth
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.returnBtn,
                                { backgroundColor: colors.accent + '15', borderColor: colors.accent },
                            ]}
                            onPress={handleReturnToBooth}
                            activeOpacity={0.7}
                            accessibilityLabel="Return to booth"
                        >
                            <Ionicons name="enter-outline" size={16} color={colors.accent} />
                            <Text style={[styles.returnBtnText, { color: colors.accent }]}>Return to Booth</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            {/* Inline cards */}
            {!hasCheckedIn && renderCheckIn()}
            {hasCheckedIn && renderLogActivity()}
            {hasCheckedIn && renderProgress()}

            {/* ── Pledge Sheet ── */}
            <Modal
                visible={showPledgeSheet}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPledgeSheet(false)}
            >
                <SafeAreaView style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                                Your Pledge for Today
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowPledgeSheet(false)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.sheetContent}>
                            <Text style={{ color: colors.textTertiary, fontSize: 13, marginBottom: 16 }}>
                                Pre-filled with suggested targets. Adjust as needed.
                            </Text>
                            {(
                                [
                                    ['pledgeSitdowns', 'Sitdowns today', setPledgeSitdowns, pledgeSitdowns],
                                    ['pledgePitches', 'Pitches today', setPledgePitches, pledgePitches],
                                    ['pledgeClosed', 'Cases to close', setPledgeClosed, pledgeClosed],
                                ] as any[]
                            ).map(([key, label, setter, val]) => (
                                <View key={key} style={styles.pledgeRow}>
                                    <Text style={[styles.pledgeLabel, { color: colors.textSecondary }]}>{label}</Text>
                                    <View style={styles.pledgeStepperRow}>
                                        <TouchableOpacity
                                            style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}
                                            onPress={() => setter((v: number) => Math.max(0, v - 1))}
                                            accessibilityLabel={`Decrease ${label}`}
                                        >
                                            <Ionicons name="remove" size={18} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                        <Text style={[styles.stepVal, { color: colors.textPrimary }]}>{val}</Text>
                                        <TouchableOpacity
                                            style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary }]}
                                            onPress={() => setter((v: number) => v + 1)}
                                            accessibilityLabel={`Increase ${label}`}
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
                                    value={pledgeAfyc}
                                    onChangeText={(v) => setPledgeAfyc(v.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                />
                            </View>
                            {checkinError && (
                                <View style={[styles.errorBanner, { backgroundColor: ERROR_BG }]}>
                                    <Text style={{ color: ERROR_TEXT, fontSize: 13 }}>{checkinError}</Text>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.checkinBtn,
                                    { backgroundColor: colors.accent, opacity: checkingIn ? 0.6 : 1 },
                                ]}
                                onPress={handleConfirmPledge}
                                disabled={checkingIn}
                            >
                                {checkingIn ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                        <Text style={styles.checkinBtnText}>Confirm &amp; Pledge</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {/* ── Activity Confirm Sheet ── */}
            <Modal
                visible={confirmActivity !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmActivity(null)}
            >
                {(() => {
                    const cfg =
                        confirmActivity === 'sitdown'
                            ? {
                                  label: 'Sitdown',
                                  icon: 'people-outline' as const,
                                  color: '#6366F1',
                                  count: myCounts.sitdowns,
                              }
                            : {
                                  label: 'Pitch',
                                  icon: 'megaphone-outline' as const,
                                  color: '#E67700',
                                  count: myCounts.pitches,
                              };
                    return (
                        <View style={styles.confirmOverlay}>
                            <TouchableOpacity
                                style={StyleSheet.absoluteFillObject}
                                activeOpacity={1}
                                onPress={() => setConfirmActivity(null)}
                            />
                            <View
                                style={[
                                    styles.confirmSheet,
                                    { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 24 },
                                ]}
                            >
                                <View style={[styles.confirmHandle, { backgroundColor: colors.border }]} />
                                <View style={[styles.confirmIconBg, { backgroundColor: cfg.color + '18' }]}>
                                    <Ionicons name={cfg.icon} size={34} color={cfg.color} />
                                </View>
                                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                                    Log {cfg.label}?
                                </Text>
                                <Text style={[styles.confirmSubtitle, { color: colors.textTertiary }]}>
                                    {cfg.count === 0 ? 'First one today' : `${cfg.count} logged so far today`}
                                </Text>
                                <Text style={[styles.confirmTimeLabel, { color: colors.textTertiary }]}>Time</Text>
                                <View style={styles.wheelRow}>
                                    <WheelPicker
                                        items={PICKER_HOURS}
                                        selectedIndex={logHour}
                                        onChange={setLogHour}
                                        colors={colors}
                                        width={52}
                                    />
                                    <WheelPicker
                                        items={PICKER_MINUTES}
                                        selectedIndex={logMinuteIdx}
                                        onChange={setLogMinuteIdx}
                                        colors={colors}
                                        width={52}
                                    />
                                    <WheelPicker
                                        items={PICKER_AMPM}
                                        selectedIndex={logAmPm}
                                        onChange={setLogAmPm}
                                        colors={colors}
                                        width={60}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: cfg.color }]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        handleLogActivity(confirmActivity!);
                                        setConfirmActivity(null);
                                    }}
                                >
                                    <Text style={styles.confirmBtnText}>Log {cfg.label}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmActivity(null)}>
                                    <Text style={[styles.confirmCancelText, { color: colors.textSecondary }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })()}
            </Modal>

            {/* ── AFYC Input Sheet ── */}
            <Modal
                visible={showAfycSheet}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAfycSheet(false)}
            >
                <SafeAreaView style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Log Case Closed</Text>
                            <TouchableOpacity
                                onPress={() => setShowAfycSheet(false)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sheetContent}>
                            <Text style={[styles.pledgeLabel, { color: colors.textSecondary, marginBottom: 6 }]}>
                                AFYC Amount ($)
                            </Text>
                            <TextInput
                                style={[
                                    styles.inputSm,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.inputBorder,
                                        color: colors.textPrimary,
                                        fontSize: 22,
                                        fontWeight: '700',
                                    },
                                ]}
                                placeholder="0"
                                placeholderTextColor={colors.textTertiary}
                                value={afycInput}
                                onChangeText={(v) => setAfycInput(v.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                autoFocus
                            />
                            <Text
                                style={[
                                    styles.pledgeLabel,
                                    { color: colors.textSecondary, marginTop: 20, marginBottom: 4 },
                                ]}
                            >
                                Time
                            </Text>
                            <View style={[styles.wheelRow, { marginBottom: 8 }]}>
                                <WheelPicker
                                    items={PICKER_HOURS}
                                    selectedIndex={logHour}
                                    onChange={setLogHour}
                                    colors={colors}
                                    width={52}
                                />
                                <WheelPicker
                                    items={PICKER_MINUTES}
                                    selectedIndex={logMinuteIdx}
                                    onChange={setLogMinuteIdx}
                                    colors={colors}
                                    width={52}
                                />
                                <WheelPicker
                                    items={PICKER_AMPM}
                                    selectedIndex={logAmPm}
                                    onChange={setLogAmPm}
                                    colors={colors}
                                    width={60}
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.checkinBtn,
                                    {
                                        backgroundColor: '#F59E0B',
                                        marginTop: 12,
                                        opacity: loggingActivity ? 0.6 : 1,
                                    },
                                ]}
                                onPress={handleLogCaseClosed}
                                disabled={loggingActivity}
                            >
                                {loggingActivity ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                        <Text style={styles.checkinBtnText}>Log Case Closed</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ marginTop: 16, alignItems: 'center' }}
                                onPress={() => {
                                    setAfycInput('0');
                                    handleLogCaseClosed();
                                }}
                            >
                                <Text style={{ color: colors.textTertiary, fontSize: 14 }}>
                                    Skip AFYC — log without amount
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </>
    );
}

export const RoadshowLiveT1 = React.memo(RoadshowLiveT1Inner);

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

    infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1 },
    lateBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 10, borderWidth: 1 },
    lateText: { fontSize: 13, fontWeight: '600' },
    errorBanner: { borderRadius: 8, padding: 10 },

    boothInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    boothInfoText: { fontSize: 14 },
    slotCostText: { fontSize: 13 },

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

    ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkinLabel: { fontSize: 13 },

    afycSection: { gap: 6 },
    afycRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    afycLabel: { fontSize: 14, fontWeight: '600' },
    afycValue: { fontSize: 14, fontWeight: '700' },
    afycTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    afycFill: { height: 6, borderRadius: 3 },

    stickyRow: { flexDirection: 'row', gap: 10 },
    logBtnLg: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 14,
        paddingVertical: 18,
        borderWidth: 1.5,
        minHeight: 90,
        position: 'relative',
    },
    logBtnLgLabel: { fontSize: 15, fontWeight: '700' },
    logBtnBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    logBtnBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    logHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logHint: { fontSize: 12 },
    caseClosedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 15,
        minHeight: 52,
    },
    caseClosedText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },

    leaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        minHeight: 40,
    },
    leaveBtnText: { fontSize: 13, fontWeight: '500' },
    departedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 4,
    },
    returnBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingVertical: 11,
        minHeight: 44,
    },
    returnBtnText: { fontSize: 14, fontWeight: '600' },

    pledgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pledgeLabel: { fontSize: 15, fontWeight: '500' },
    pledgeStepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    stepVal: { fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center' },

    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    confirmSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        alignItems: 'center',
        gap: 10,
    },
    confirmHandle: { width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
    confirmIconBg: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    confirmTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    confirmSubtitle: { fontSize: 14 },
    confirmBtn: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 16,
        minHeight: 52,
        marginTop: 6,
    },
    confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    confirmCancel: { paddingVertical: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    confirmCancelText: { fontSize: 16 },
    confirmTimeLabel: { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: -4 },
    wheelRow: { flexDirection: 'row', gap: 0, alignItems: 'center', justifyContent: 'center' },
});
