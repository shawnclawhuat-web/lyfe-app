import InterviewCard from '@/components/InterviewCard';
import LoadingState from '@/components/LoadingState';
import ScreenHeader from '@/components/ScreenHeader';
import StatusStepper from '@/components/StatusStepper';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useContactOutcome } from '@/hooks/useContactOutcome';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import { useInterviewScheduler } from '@/hooks/useInterviewScheduler';
import { addCandidateActivity, fetchCandidate } from '@/lib/recruitment';
import { timeAgo } from '@/lib/dateTime';
import {
    CANDIDATE_STATUS_CONFIG,
    DOCUMENT_LABELS,
    type CandidateActivity,
    type Interview,
    type RecruitmentCandidate,
} from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ERROR_BG, ERROR_TEXT } from '@/constants/ui';
import { formatCreatedAt } from '@/lib/dateTime';
import { WebView } from 'react-native-webview';
let Clipboard: typeof import('expo-clipboard') | null = null;
try {
    Clipboard = require('expo-clipboard');
} catch (e) {
    console.warn('expo-clipboard not available:', e);
}

// ── Wheel Picker ──

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const AMPM = ['AM', 'PM'];
const WHEEL_ITEM_H = 44;

function WheelPicker({
    items,
    selectedIndex,
    onChange,
    colors,
    width = 80,
}: {
    items: string[];
    selectedIndex: number;
    onChange: (i: number) => void;
    colors: any;
    width?: number;
}) {
    const scrollRef = useRef<ScrollView>(null);
    const [scrollY, setScrollY] = useState(selectedIndex * WHEEL_ITEM_H);

    useEffect(() => {
        const t = setTimeout(() => {
            scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_H, animated: false });
        }, 50);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEnd = (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const idx = Math.max(0, Math.min(items.length - 1, Math.round(y / WHEEL_ITEM_H)));
        setScrollY(idx * WHEEL_ITEM_H);
        onChange(idx);
    };

    const centerIdx = scrollY / WHEEL_ITEM_H;

    return (
        <View style={{ height: WHEEL_ITEM_H * 5, width, overflow: 'hidden' }}>
            {/* Selection indicator lines */}
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: WHEEL_ITEM_H * 2,
                    left: 6,
                    right: 6,
                    height: WHEEL_ITEM_H,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                }}
            />
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_H}
                decelerationRate="fast"
                onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleEnd}
                onScrollEndDrag={handleEnd}
                contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * 2 }}
            >
                {items.map((item, i) => {
                    const dist = Math.abs(centerIdx - i);
                    const opacity = Math.max(0.15, 1 - dist * 0.45);
                    const isSelected = dist < 0.5;
                    return (
                        <View key={i} style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
                            <Text
                                style={{
                                    fontSize: isSelected ? 22 : 16,
                                    fontWeight: isSelected ? '700' : '400',
                                    opacity,
                                    color: isSelected ? colors.accent : colors.textPrimary,
                                    letterSpacing: -0.3,
                                }}
                            >
                                {item}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ── Main Screen ──

export default function CandidateDetailScreen() {
    const { candidateId } = useLocalSearchParams<{ candidateId: string }>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const [candidate, setCandidate] = useState<RecruitmentCandidate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Contact history
    const [callLog, setCallLog] = useState<CandidateActivity[]>([]);

    // Note sheet
    const [showNoteSheet, setShowNoteSheet] = useState(false);
    const [noteSheetText, setNoteSheetText] = useState('');

    // ── Document Manager Hook ──
    const docManager = useDocumentManager({ candidateId: candidateId || '' });
    const {
        documents,
        showPdf,
        pdfUrl,
        pdfTitle,
        showAddDoc,
        addDocLabel,
        addDocCustomLabel,
        addDocStep,
        addDocError,
        hasDocumentPicker,
        setShowPdf,
        setShowAddDoc,
        setAddDocLabel,
        setAddDocCustomLabel,
        handleViewDocument,
        handleDeleteDocument,
        handleSelectLabel,
        pickAndUploadDocument,
        openAddDocSheet,
    } = docManager;

    // ── Contact Outcome Hook ──
    const contactOutcome = useContactOutcome({
        candidateId: candidateId || '',
        candidateName: candidate?.name || '',
        candidatePhone: candidate?.phone || '',
        userId: user?.id,
        userName: user?.full_name,
        onActivityLogged: useCallback((activity: CandidateActivity) => {
            setCallLog((prev) => [activity, ...prev]);
        }, []),
    });
    const {
        pendingType,
        showConfirmSheet,
        confirmStep,
        selectedOutcome,
        noteText,
        setNoteText,
        handleCall,
        handleWhatsApp,
        handleOutcomeSelect,
        handleSaveActivity,
        handleDismissSheet,
    } = contactOutcome;

    // ── Interview Scheduler Hook ──
    const scheduler = useInterviewScheduler({
        candidateId: candidateId || '',
        candidateManagerId: candidate?.assigned_manager_id || '',
        candidateInterviewCount: candidate?.interviews.length ?? 0,
        userId: user?.id,
        onInterviewChanged: useCallback((action: 'created' | 'updated' | 'deleted', interview: Interview) => {
            if (action === 'created') {
                setCandidate((prev) => (prev ? { ...prev, interviews: [interview, ...prev.interviews] } : prev));
            } else if (action === 'updated') {
                setCandidate((prev) =>
                    prev
                        ? {
                              ...prev,
                              interviews: prev.interviews.map((iv) => (iv.id === interview.id ? interview : iv)),
                          }
                        : prev,
                );
            } else if (action === 'deleted') {
                setCandidate((prev) =>
                    prev
                        ? {
                              ...prev,
                              interviews: prev.interviews.filter((iv) => iv.id !== interview.id),
                          }
                        : prev,
                );
            }
        }, []),
    });
    const {
        showScheduleSheet,
        editingInterview,
        scheduleStatus,
        scheduleDate,
        scheduleHour,
        scheduleMinute,
        scheduleAmPm,
        scheduleType,
        scheduleLink,
        scheduleLocation,
        scheduleNotes,
        isScheduling,
        scheduleError,
        setScheduleDate,
        setScheduleHour,
        setScheduleMinute,
        setScheduleAmPm,
        setScheduleType,
        setScheduleLink,
        setScheduleLocation,
        setScheduleNotes,
        setScheduleStatus,
        openNewInterview,
        openEditInterview,
        closeScheduleSheet,
        dismissScheduleSheet,
        handleDeleteInterview,
        handleSubmitSchedule,
    } = scheduler;

    const loadCandidate = useCallback(async () => {
        if (!candidateId) return;
        setError(null);
        const { data, error: fetchError } = await fetchCandidate(candidateId);
        if (fetchError) {
            setError(fetchError);
        } else {
            setCandidate(data);
        }
        setIsLoading(false);
    }, [candidateId]);

    useEffect(() => {
        loadCandidate();
    }, [loadCandidate]);

    // Load documents separately via hook
    useEffect(() => {
        if (candidateId) {
            docManager.loadDocuments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [candidateId]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader showBack backLabel="Candidates" title="Loading..." />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (!candidate) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader showBack backLabel="Candidates" title="Not Found" />
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
                        {error || 'Candidate not found'}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.accent, fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = CANDIDATE_STATUS_CONFIG[candidate.status];
    const sortedInterviews = [...candidate.interviews].sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
    );

    // ── Note sheet ──

    const handleSaveNote = () => {
        const text = noteSheetText.trim();
        if (!text) return;
        const activity: CandidateActivity = {
            id: `ca_${Date.now()}`,
            candidate_id: candidate.id,
            user_id: user?.id || 'me',
            type: 'note',
            outcome: null,
            note: text,
            created_at: new Date().toISOString(),
            actor_name: user?.full_name || undefined,
        };
        setCallLog((prev) => [activity, ...prev]);
        if (user?.id) {
            addCandidateActivity(candidate.id, user.id, 'note', null, text);
        }
        setNoteSheetText('');
        setShowNoteSheet(false);
    };

    // ── Schedule sheet helpers (used in JSX) ──

    const addDays = (date: Date, days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    };
    const formatScheduleDate = (date: Date) =>
        date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const isToday = (date: Date) => {
        const now = new Date();
        return date.toDateString() === now.toDateString();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader showBack backLabel="Candidates" title={candidate.name} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: statusConfig.color + '18' }]}>
                            <Text style={[styles.avatarText, { color: statusConfig.color }]}>
                                {candidate.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{candidate.name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '14' }]}>
                                <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.contactSection, { borderTopColor: colors.borderLight || colors.border }]}>
                        <View style={styles.contactRow}>
                            <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
                            <Text style={[styles.contactText, { color: colors.textSecondary }]}>{candidate.phone}</Text>
                        </View>
                        {candidate.email && (
                            <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={16} color={colors.textTertiary} />
                                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                    {candidate.email}
                                </Text>
                            </View>
                        )}
                        <View style={styles.contactRow}>
                            <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                Recruiter: {candidate.assigned_manager_name}
                            </Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                Applied {formatCreatedAt(candidate.created_at)} · Updated{' '}
                                {timeAgo(candidate.updated_at)}
                            </Text>
                        </View>
                    </View>

                    {candidate.status === 'applied' && candidate.invite_token && (
                        <TouchableOpacity
                            style={[styles.inviteBanner, { backgroundColor: colors.accentLight }]}
                            activeOpacity={0.7}
                            onPress={async () => {
                                const link = `https://lyfe-admin.vercel.app/invite/${candidate.invite_token}`;
                                if (Clipboard) {
                                    await Clipboard.setStringAsync(link);
                                    Alert.alert('Copied', 'Invite link copied to clipboard');
                                } else {
                                    Share.share({ message: link });
                                }
                            }}
                        >
                            <Ionicons name="link-outline" size={16} color={colors.accent} />
                            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                                Copy Invite Link
                            </Text>
                            <Ionicons name="copy-outline" size={14} color={colors.accent} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Actions */}
                <View
                    style={[
                        styles.actionsCard,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <QuickAction icon="call" label="Call" color="#16A34A" bgColor="#DCFCE7" onPress={handleCall} />
                    <QuickAction
                        icon="logo-whatsapp"
                        label="WhatsApp"
                        color="#25D366"
                        bgColor="#D1FAE5"
                        onPress={handleWhatsApp}
                    />
                    <QuickAction
                        icon="calendar"
                        label="Schedule"
                        color="#FF9500"
                        bgColor="#FFF3E0"
                        onPress={openNewInterview}
                    />
                    <QuickAction
                        icon="create-outline"
                        label="Note"
                        color="#6B7280"
                        bgColor={colors.surfacePrimary || colors.background}
                        onPress={() => setShowNoteSheet(true)}
                    />
                </View>

                {/* Documents */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Documents</Text>
                        {documents.length > 0 && (
                            <Text style={[styles.countBadge, { color: colors.textTertiary }]}>{documents.length}</Text>
                        )}
                    </View>

                    {documents.length === 0 ? (
                        <View style={docStyles.emptyState}>
                            <Ionicons name="folder-open-outline" size={28} color={colors.textTertiary} />
                            <Text style={[docStyles.emptyText, { color: colors.textTertiary }]}>No documents yet</Text>
                        </View>
                    ) : (
                        documents.map((doc) => (
                            <View key={doc.id} style={[docStyles.docRow, { backgroundColor: colors.surfacePrimary }]}>
                                <View style={[docStyles.labelChip, { backgroundColor: colors.accentLight }]}>
                                    <Text style={[docStyles.labelChipText, { color: colors.accent }]} numberOfLines={1}>
                                        {doc.label}
                                    </Text>
                                </View>
                                <Text
                                    style={[docStyles.docFileName, { color: colors.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {doc.file_name}
                                </Text>
                                <TouchableOpacity
                                    style={[docStyles.viewBtn, { backgroundColor: colors.accent }]}
                                    onPress={() => handleViewDocument(doc)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
                                    <Text style={docStyles.viewBtnText}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDeleteDocument(doc)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={{ marginLeft: 6 }}
                                >
                                    <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                    <TouchableOpacity
                        style={[
                            docStyles.addBtn,
                            { borderColor: colors.accent, opacity: !hasDocumentPicker ? 0.4 : 1 },
                        ]}
                        onPress={openAddDocSheet}
                        activeOpacity={0.7}
                        disabled={!hasDocumentPicker}
                    >
                        <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                        <Text style={[docStyles.addBtnText, { color: colors.accent }]}>Add Document</Text>
                    </TouchableOpacity>
                </View>

                {/* Contact History */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact History</Text>
                        {callLog.length > 0 && (
                            <Text style={[styles.countBadge, { color: colors.textTertiary }]}>{callLog.length}</Text>
                        )}
                    </View>
                    {callLog.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="call-outline" size={28} color={colors.textTertiary} />
                            <Text style={[styles.emptyHistoryText, { color: colors.textTertiary }]}>
                                No calls or messages logged yet.{'\n'}Tap Call or WhatsApp above to start.
                            </Text>
                        </View>
                    ) : (
                        callLog.map((entry, idx) => (
                            <ActivityEntry
                                key={entry.id}
                                entry={entry}
                                isLast={idx === callLog.length - 1}
                                colors={colors}
                            />
                        ))
                    )}
                </View>

                {/* Pipeline Progress */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pipeline Progress</Text>
                    <StatusStepper currentStatus={candidate.status} colors={colors} />
                </View>

                {/* Notes */}
                {candidate.notes && (
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
                        <Text style={[styles.notesBody, { color: colors.textSecondary }]}>{candidate.notes}</Text>
                    </View>
                )}

                {/* Interviews */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Interviews</Text>
                        <Text style={[styles.countBadge, { color: colors.textTertiary }]}>
                            {sortedInterviews.length}
                        </Text>
                    </View>
                    {sortedInterviews.length === 0 ? (
                        <View style={styles.emptyInterviews}>
                            <Ionicons name="videocam-off-outline" size={32} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No interviews yet</Text>
                        </View>
                    ) : (
                        sortedInterviews.map((interview) => (
                            <InterviewCard
                                key={interview.id}
                                interview={interview}
                                colors={colors}
                                onEdit={() => openEditInterview(interview)}
                                onDelete={() => handleDeleteInterview(interview)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
            {/* ── 2-Step Contact Confirm Sheet ── */}
            <Modal
                visible={showConfirmSheet}
                transparent
                animationType="slide"
                onRequestClose={confirmStep === 'outcome' ? handleDismissSheet : () => handleSaveActivity(true)}
            >
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TouchableOpacity
                        style={sheetStyles.overlay}
                        activeOpacity={1}
                        onPress={confirmStep === 'outcome' ? handleDismissSheet : () => handleSaveActivity(true)}
                    >
                        <View
                            style={[sheetStyles.sheet, { backgroundColor: colors.cardBackground }]}
                            onStartShouldSetResponder={() => true}
                        >
                            {/* Drag handle */}
                            <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />

                            {confirmStep === 'outcome' ? (
                                /* ── Step 1: Outcome selection ── */
                                <>
                                    <View
                                        style={[
                                            sheetStyles.iconWrap,
                                            {
                                                backgroundColor: pendingType === 'whatsapp' ? '#D1FAE5' : '#DCFCE7',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={pendingType === 'whatsapp' ? 'logo-whatsapp' : 'call'}
                                            size={30}
                                            color={pendingType === 'whatsapp' ? '#25D366' : '#16A34A'}
                                        />
                                    </View>

                                    <Text style={[sheetStyles.title, { color: colors.textPrimary }]}>
                                        {pendingType === 'whatsapp' ? 'Did you message them?' : 'How did the call go?'}
                                    </Text>
                                    <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>
                                        {candidate.name} · {candidate.phone}
                                    </Text>

                                    {pendingType === 'call' ? (
                                        <>
                                            <TouchableOpacity
                                                style={[sheetStyles.primaryBtn, { backgroundColor: colors.accent }]}
                                                onPress={() => handleOutcomeSelect('reached')}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                                <Text style={sheetStyles.primaryBtnText}>Connected</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    sheetStyles.secondaryBtn,
                                                    {
                                                        borderColor: colors.border,
                                                        backgroundColor: colors.surfacePrimary,
                                                    },
                                                ]}
                                                onPress={() => handleOutcomeSelect('no_answer')}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons
                                                    name="close-circle-outline"
                                                    size={20}
                                                    color={colors.textSecondary}
                                                />
                                                <Text
                                                    style={[
                                                        sheetStyles.secondaryBtnText,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                >
                                                    No answer
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={[sheetStyles.primaryBtn, { backgroundColor: '#25D366' }]}
                                            onPress={() => handleOutcomeSelect('sent')}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                            <Text style={sheetStyles.primaryBtnText}>Yes, sent</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        onPress={handleDismissSheet}
                                        style={sheetStyles.skipRow}
                                        hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
                                    >
                                        <Text style={[sheetStyles.skipText, { color: colors.textTertiary }]}>
                                            Don't log this
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* ── Step 2: Optional note ── */
                                <>
                                    {/* Outcome recap pill */}
                                    <View
                                        style={[
                                            sheetStyles.outcomePill,
                                            {
                                                backgroundColor:
                                                    selectedOutcome === 'no_answer' ? colors.surfacePrimary : '#DCFCE7',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={selectedOutcome === 'no_answer' ? 'close-circle' : 'checkmark-circle'}
                                            size={14}
                                            color={selectedOutcome === 'no_answer' ? colors.textTertiary : '#16A34A'}
                                        />
                                        <Text
                                            style={[
                                                sheetStyles.outcomePillText,
                                                {
                                                    color:
                                                        selectedOutcome === 'no_answer'
                                                            ? colors.textSecondary
                                                            : '#16A34A',
                                                },
                                            ]}
                                        >
                                            {selectedOutcome === 'reached'
                                                ? 'Connected'
                                                : selectedOutcome === 'no_answer'
                                                  ? 'No answer'
                                                  : 'Sent'}
                                        </Text>
                                    </View>

                                    <Text style={[sheetStyles.noteLabel, { color: colors.textPrimary }]}>
                                        Add a note{'  '}
                                        <Text style={[sheetStyles.noteLabelOptional, { color: colors.textTertiary }]}>
                                            optional
                                        </Text>
                                    </Text>

                                    <TextInput
                                        style={[
                                            sheetStyles.noteInput,
                                            {
                                                color: colors.textPrimary,
                                                backgroundColor: colors.surfacePrimary,
                                            },
                                        ]}
                                        placeholder="e.g. Very interested, wants to start soon..."
                                        placeholderTextColor={colors.textTertiary}
                                        value={noteText}
                                        onChangeText={setNoteText}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        autoFocus
                                    />

                                    <TouchableOpacity
                                        style={[sheetStyles.primaryBtn, { backgroundColor: colors.accent }]}
                                        onPress={() => handleSaveActivity(false)}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                        <Text style={sheetStyles.primaryBtnText}>Save & Log</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleSaveActivity(true)}
                                        style={sheetStyles.skipRow}
                                        hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
                                    >
                                        <Text style={[sheetStyles.skipText, { color: colors.textTertiary }]}>
                                            Skip note
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Note Sheet */}
            <Modal
                visible={showNoteSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNoteSheet(false)}
            >
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TouchableOpacity
                        style={sheetStyles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowNoteSheet(false)}
                    >
                        <View
                            style={[sheetStyles.sheet, { backgroundColor: colors.cardBackground }]}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
                            <View style={[schedStyles.iconWrap, { backgroundColor: colors.surfacePrimary }]}>
                                <Ionicons name="create-outline" size={28} color={colors.textSecondary} />
                            </View>
                            <Text style={[sheetStyles.sheetTitle, { color: colors.textPrimary }]}>Add Note</Text>
                            <TextInput
                                style={[
                                    sheetStyles.noteInput,
                                    { color: colors.textPrimary, backgroundColor: colors.surfacePrimary },
                                ]}
                                placeholder="What happened? Any follow-up actions?"
                                placeholderTextColor={colors.textTertiary}
                                value={noteSheetText}
                                onChangeText={setNoteSheetText}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                autoFocus
                            />
                            <TouchableOpacity
                                style={[
                                    sheetStyles.primaryBtn,
                                    { backgroundColor: colors.accent, opacity: noteSheetText.trim() ? 1 : 0.4 },
                                ]}
                                onPress={handleSaveNote}
                                activeOpacity={0.85}
                                disabled={!noteSheetText.trim()}
                            >
                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                <Text style={sheetStyles.primaryBtnText}>Save Note</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Schedule Interview Sheet */}
            <Modal visible={showScheduleSheet} transparent animationType="slide" onRequestClose={dismissScheduleSheet}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={sheetStyles.overlay}>
                        {/* Backdrop — tapping outside dismisses */}
                        <Pressable style={StyleSheet.absoluteFill} onPress={dismissScheduleSheet} />

                        {/* Sheet content — isolated from backdrop taps */}
                        <View style={[schedStyles.sheet, { backgroundColor: colors.cardBackground }]}>
                            <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
                            <Text style={[sheetStyles.sheetTitle, { color: colors.textPrimary }]}>
                                {editingInterview
                                    ? `Edit Interview · Round ${editingInterview.round_number}`
                                    : `Schedule Interview · Round ${(candidate?.interviews.length ?? 0) + 1}`}
                            </Text>

                            <ScrollView
                                style={{ width: '100%' }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {scheduleError && (
                                    <View style={[schedStyles.errorRow, { backgroundColor: ERROR_BG }]}>
                                        <Ionicons name="alert-circle" size={14} color={ERROR_TEXT} />
                                        <Text style={schedStyles.errorText}>{scheduleError}</Text>
                                    </View>
                                )}

                                {/* Date row */}
                                <Text style={[schedStyles.fieldLabel, { color: colors.textTertiary }]}>Date</Text>
                                <View style={[schedStyles.row, { backgroundColor: colors.surfacePrimary }]}>
                                    <TouchableOpacity
                                        onPress={() => setScheduleDate((d) => addDays(d, -1))}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                    >
                                        <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text
                                        style={[
                                            schedStyles.rowValue,
                                            { color: colors.textPrimary, flex: 1, textAlign: 'center' },
                                        ]}
                                    >
                                        {formatScheduleDate(scheduleDate)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setScheduleDate((d) => addDays(d, 1))}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                    >
                                        <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                {!isToday(scheduleDate) && (
                                    <TouchableOpacity
                                        onPress={() => setScheduleDate(new Date())}
                                        style={schedStyles.todayBtn}
                                    >
                                        <Text style={[schedStyles.todayBtnText, { color: colors.accent }]}>
                                            Jump to today
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Time wheel picker */}
                                <Text style={[schedStyles.fieldLabel, { color: colors.textTertiary }]}>Time</Text>
                                <View style={[schedStyles.wheelContainer, { backgroundColor: colors.surfacePrimary }]}>
                                    <WheelPicker
                                        key={`hour-${editingInterview?.id ?? 'new'}`}
                                        items={HOURS}
                                        selectedIndex={Math.max(0, HOURS.indexOf(scheduleHour.toString()))}
                                        onChange={(idx) => setScheduleHour(parseInt(HOURS[idx]))}
                                        colors={colors}
                                        width={80}
                                    />
                                    <Text style={[schedStyles.wheelColon, { color: colors.textPrimary }]}>:</Text>
                                    <WheelPicker
                                        key={`min-${editingInterview?.id ?? 'new'}`}
                                        items={MINUTES}
                                        selectedIndex={Math.max(
                                            0,
                                            MINUTES.indexOf(scheduleMinute.toString().padStart(2, '0')),
                                        )}
                                        onChange={(idx) => setScheduleMinute(parseInt(MINUTES[idx]))}
                                        colors={colors}
                                        width={72}
                                    />
                                    <View style={[schedStyles.wheelVertDivider, { backgroundColor: colors.border }]} />
                                    <WheelPicker
                                        key={`ampm-${editingInterview?.id ?? 'new'}`}
                                        items={AMPM}
                                        selectedIndex={scheduleAmPm === 'AM' ? 0 : 1}
                                        onChange={(idx) => setScheduleAmPm(AMPM[idx] as 'AM' | 'PM')}
                                        colors={colors}
                                        width={64}
                                    />
                                </View>

                                {/* Type toggle */}
                                <Text style={[schedStyles.fieldLabel, { color: colors.textTertiary }]}>Format</Text>
                                <View style={schedStyles.typeToggle}>
                                    <TouchableOpacity
                                        style={[
                                            schedStyles.typeBtn,
                                            {
                                                backgroundColor:
                                                    scheduleType === 'zoom' ? colors.accent : colors.surfacePrimary,
                                            },
                                        ]}
                                        onPress={() => setScheduleType('zoom')}
                                    >
                                        <Ionicons
                                            name="videocam-outline"
                                            size={16}
                                            color={scheduleType === 'zoom' ? '#FFF' : colors.textSecondary}
                                        />
                                        <Text
                                            style={[
                                                schedStyles.typeBtnText,
                                                { color: scheduleType === 'zoom' ? '#FFF' : colors.textSecondary },
                                            ]}
                                        >
                                            Zoom
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            schedStyles.typeBtn,
                                            {
                                                backgroundColor:
                                                    scheduleType === 'in_person'
                                                        ? colors.accent
                                                        : colors.surfacePrimary,
                                            },
                                        ]}
                                        onPress={() => setScheduleType('in_person')}
                                    >
                                        <Ionicons
                                            name="business-outline"
                                            size={16}
                                            color={scheduleType === 'in_person' ? '#FFF' : colors.textSecondary}
                                        />
                                        <Text
                                            style={[
                                                schedStyles.typeBtnText,
                                                { color: scheduleType === 'in_person' ? '#FFF' : colors.textSecondary },
                                            ]}
                                        >
                                            In-person
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Link or location */}
                                {scheduleType === 'zoom' ? (
                                    <TextInput
                                        style={[
                                            schedStyles.input,
                                            { color: colors.textPrimary, backgroundColor: colors.surfacePrimary },
                                        ]}
                                        placeholder="Zoom link (optional)"
                                        placeholderTextColor={colors.textTertiary}
                                        value={scheduleLink}
                                        onChangeText={setScheduleLink}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                ) : (
                                    <TextInput
                                        style={[
                                            schedStyles.input,
                                            { color: colors.textPrimary, backgroundColor: colors.surfacePrimary },
                                        ]}
                                        placeholder="Location (optional)"
                                        placeholderTextColor={colors.textTertiary}
                                        value={scheduleLocation}
                                        onChangeText={setScheduleLocation}
                                    />
                                )}

                                {/* Notes */}
                                <TextInput
                                    style={[
                                        schedStyles.input,
                                        {
                                            color: colors.textPrimary,
                                            backgroundColor: colors.surfacePrimary,
                                            minHeight: 56,
                                        },
                                    ]}
                                    placeholder="Notes (optional)"
                                    placeholderTextColor={colors.textTertiary}
                                    value={scheduleNotes}
                                    onChangeText={setScheduleNotes}
                                    multiline
                                    textAlignVertical="top"
                                />

                                {/* Status — edit mode only */}
                                {editingInterview && (
                                    <>
                                        <Text style={[schedStyles.fieldLabel, { color: colors.textTertiary }]}>
                                            Status
                                        </Text>
                                        <View style={[schedStyles.typeToggle, { flexWrap: 'wrap' }]}>
                                            {(['scheduled', 'completed', 'rescheduled', 'cancelled'] as const).map(
                                                (s) => (
                                                    <TouchableOpacity
                                                        key={s}
                                                        style={[
                                                            schedStyles.typeBtn,
                                                            {
                                                                backgroundColor:
                                                                    scheduleStatus === s
                                                                        ? colors.accent
                                                                        : colors.surfacePrimary,
                                                                flex: undefined,
                                                                paddingHorizontal: 14,
                                                            },
                                                        ]}
                                                        onPress={() => setScheduleStatus(s)}
                                                    >
                                                        <Text
                                                            style={[
                                                                schedStyles.typeBtnText,
                                                                {
                                                                    color:
                                                                        scheduleStatus === s
                                                                            ? '#FFF'
                                                                            : colors.textSecondary,
                                                                    fontSize: 13,
                                                                },
                                                            ]}
                                                        >
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ),
                                            )}
                                        </View>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={[
                                        sheetStyles.primaryBtn,
                                        { backgroundColor: '#FF9500', opacity: isScheduling ? 0.6 : 1 },
                                    ]}
                                    onPress={handleSubmitSchedule}
                                    activeOpacity={0.85}
                                    disabled={isScheduling}
                                >
                                    <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                                    <Text style={sheetStyles.primaryBtnText}>
                                        {isScheduling
                                            ? 'Saving…'
                                            : editingInterview
                                              ? 'Save Changes'
                                              : 'Confirm Schedule'}
                                    </Text>
                                </TouchableOpacity>

                                <View style={{ height: 8 }} />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Document Sheet */}
            <Modal visible={showAddDoc} transparent animationType="slide" onRequestClose={() => setShowAddDoc(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <TouchableOpacity
                        style={sheetStyles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowAddDoc(false)}
                    >
                        <View
                            style={[docStyles.addSheet, { backgroundColor: colors.cardBackground }]}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
                            <Text style={[sheetStyles.sheetTitle, { color: colors.textPrimary }]}>
                                {addDocStep === 'uploading' ? 'Uploading…' : 'Add Document'}
                            </Text>

                            {addDocError && (
                                <View style={[schedStyles.errorRow, { backgroundColor: ERROR_BG }]}>
                                    <Ionicons name="alert-circle" size={14} color={ERROR_TEXT} />
                                    <Text style={schedStyles.errorText}>{addDocError}</Text>
                                </View>
                            )}

                            {addDocStep === 'uploading' ? (
                                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                    <Ionicons name="cloud-upload-outline" size={40} color={colors.accent} />
                                    <Text style={[{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }]}>
                                        Uploading PDF…
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={[docStyles.pickerHint, { color: colors.textTertiary }]}>
                                        Select a document type, then pick a PDF
                                    </Text>
                                    <View style={docStyles.labelGrid}>
                                        {DOCUMENT_LABELS.map((lbl) => (
                                            <TouchableOpacity
                                                key={lbl}
                                                style={[
                                                    docStyles.labelPill,
                                                    {
                                                        backgroundColor:
                                                            addDocLabel === lbl ? colors.accent : colors.surfacePrimary,
                                                    },
                                                ]}
                                                onPress={() => handleSelectLabel(lbl)}
                                                activeOpacity={0.75}
                                            >
                                                <Text
                                                    style={[
                                                        docStyles.labelPillText,
                                                        {
                                                            color:
                                                                addDocLabel === lbl ? '#FFFFFF' : colors.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {lbl}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {addDocLabel === 'Other' && (
                                        <>
                                            <TextInput
                                                style={[
                                                    schedStyles.input,
                                                    {
                                                        color: colors.textPrimary,
                                                        backgroundColor: colors.surfacePrimary,
                                                        width: '100%',
                                                    },
                                                ]}
                                                placeholder="Document name (e.g. BCP Certificate)"
                                                placeholderTextColor={colors.textTertiary}
                                                value={addDocCustomLabel}
                                                onChangeText={setAddDocCustomLabel}
                                                autoFocus
                                            />
                                            <TouchableOpacity
                                                style={[
                                                    sheetStyles.primaryBtn,
                                                    {
                                                        backgroundColor: colors.accent,
                                                        opacity: addDocCustomLabel.trim() ? 1 : 0.4,
                                                    },
                                                ]}
                                                onPress={() => pickAndUploadDocument(addDocCustomLabel.trim())}
                                                disabled={!addDocCustomLabel.trim()}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                                                <Text style={sheetStyles.primaryBtnText}>Pick PDF</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* PDF Viewer Modal */}
            <Modal visible={showPdf} animationType="slide" onRequestClose={() => setShowPdf(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#1C1C1E',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setShowPdf(false)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text
                            style={{ flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' }}
                            numberOfLines={1}
                        >
                            {pdfTitle}
                        </Text>
                        <View style={{ width: 32 }} />
                    </View>
                    {pdfUrl && <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} originWhitelist={['*']} />}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

// ── QuickAction Button ──

function QuickAction({
    icon,
    label,
    color,
    bgColor,
    onPress,
    disabled,
}: {
    icon: string;
    label: string;
    color: string;
    bgColor: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.quickAction, { opacity: disabled ? 0.4 : 1 }]}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ── Styles ──

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 16,
        marginBottom: 12,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 22, fontWeight: '800' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
    },
    statusBadgeText: { fontSize: 12, fontWeight: '600' },
    contactSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 0.5,
        gap: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: { fontSize: 14 },
    inviteBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    actionsCard: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 12,
        marginBottom: 12,
        justifyContent: 'space-around',
    },
    quickAction: { alignItems: 'center', gap: 4 },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: { fontSize: 11, fontWeight: '600' },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    countBadge: { fontSize: 13, fontWeight: '600' },
    notesBody: { fontSize: 14, lineHeight: 20 },
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyHistoryText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    emptyInterviews: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyText: { fontSize: 14 },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    notFoundText: { fontSize: 16, fontWeight: '600' },
});

// ── Resume Styles ──

const resumeStyles = StyleSheet.create({
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    errorText: { flex: 1, fontSize: 12, color: ERROR_TEXT },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    fileIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileName: { fontSize: 14, fontWeight: '600' },
    fileMeta: { fontSize: 12, marginTop: 1 },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    viewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'dashed',
    },
    uploadBtnText: { fontSize: 14, fontWeight: '600' },
});

const docStyles = StyleSheet.create({
    emptyState: { alignItems: 'center', paddingVertical: 20, gap: 6 },
    emptyText: { fontSize: 13 },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
        gap: 8,
    },
    labelChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        maxWidth: 90,
    },
    labelChipText: { fontSize: 12, fontWeight: '700' },
    docFileName: { flex: 1, fontSize: 13 },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    viewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    addBtnText: { fontSize: 14, fontWeight: '600' },
    // Add doc sheet
    addSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 12,
        alignItems: 'center',
    },
    pickerHint: { fontSize: 13, marginBottom: 16, textAlign: 'center' },
    labelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 16,
        width: '100%',
    },
    labelPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    labelPillText: { fontSize: 14, fontWeight: '600' },
});

// ── Activity Entry ──

function ActivityEntry({ entry, isLast, colors }: { entry: CandidateActivity; isLast: boolean; colors: any }) {
    const isNote = entry.type === 'note';
    const isPositive = entry.outcome === 'reached' || entry.outcome === 'sent';
    const dotColor = isNote ? '#6B7280' : isPositive ? '#16A34A' : colors.textTertiary;
    const iconName = isNote ? 'create-outline' : entry.type === 'whatsapp' ? 'logo-whatsapp' : 'call';
    const iconColor = isNote ? '#6B7280' : entry.type === 'whatsapp' ? '#25D366' : dotColor;
    const outcomeLabel =
        entry.outcome === 'reached'
            ? 'Connected'
            : entry.outcome === 'no_answer'
              ? 'No answer'
              : entry.outcome === 'sent'
                ? 'Sent'
                : '';
    const typeLabel = isNote ? 'Note' : entry.type === 'whatsapp' ? 'WhatsApp' : 'Call';

    return (
        <View style={entryStyles.row}>
            <View style={entryStyles.timelineCol}>
                <View style={[entryStyles.dot, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={iconName as any} size={13} color={iconColor} />
                </View>
                {!isLast && <View style={[entryStyles.line, { backgroundColor: colors.border }]} />}
            </View>
            <View style={[entryStyles.content, { paddingBottom: isLast ? 0 : 16 }]}>
                <Text style={[entryStyles.title, { color: colors.textPrimary }]}>
                    {typeLabel}
                    {outcomeLabel ? (
                        <>
                            {'  '}
                            <Text style={[entryStyles.outcome, { color: dotColor }]}>{outcomeLabel}</Text>
                        </>
                    ) : null}
                </Text>
                {entry.note ? (
                    <View style={[entryStyles.noteBox, { backgroundColor: colors.surfacePrimary }]}>
                        <Text style={[entryStyles.noteText, { color: colors.textSecondary }]}>{entry.note}</Text>
                    </View>
                ) : null}
                <Text style={[entryStyles.meta, { color: colors.textTertiary }]}>
                    {entry.actor_name ? `${entry.actor_name} · ` : ''}
                    {timeAgo(entry.created_at)}
                </Text>
            </View>
        </View>
    );
}

const entryStyles = StyleSheet.create({
    row: { flexDirection: 'row' },
    timelineCol: { width: 32, alignItems: 'center' },
    dot: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: { width: 2, flex: 1, marginTop: 4 },
    content: { flex: 1, marginLeft: 8, paddingTop: 3 },
    title: { fontSize: 14, fontWeight: '600' },
    outcome: { fontSize: 14, fontWeight: '600' },
    noteBox: {
        marginTop: 6,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    noteText: { fontSize: 13, lineHeight: 18 },
    meta: { fontSize: 11, marginTop: 5 },
});

// ── 2-Step Sheet Styles ──

const sheetStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
        alignItems: 'center',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 24,
    },
    iconWrap: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 19,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
    },
    primaryBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        marginBottom: 10,
        minHeight: 52,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
        minHeight: 52,
    },
    secondaryBtnText: { fontSize: 16, fontWeight: '600' },
    skipRow: { paddingVertical: 8, marginTop: 4 },
    skipText: { fontSize: 14, fontWeight: '500' },
    // Step 2
    outcomePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 20,
    },
    outcomePillText: { fontSize: 13, fontWeight: '600' },
    noteLabel: {
        alignSelf: 'flex-start',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    noteLabelOptional: { fontSize: 13, fontWeight: '400' },
    noteInput: {
        width: '100%',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        minHeight: 90,
        marginBottom: 16,
        lineHeight: 22,
    },
});

const schedStyles = StyleSheet.create({
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        maxHeight: '92%',
        alignItems: 'center',
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 16,
    },
    rowValue: { fontSize: 15, fontWeight: '600' },
    wheelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        marginBottom: 16,
        width: '100%',
        paddingVertical: 4,
        overflow: 'hidden',
    },
    wheelColon: {
        fontSize: 26,
        fontWeight: '300',
        marginHorizontal: 2,
        marginBottom: 2,
    },
    wheelVertDivider: {
        width: StyleSheet.hairlineWidth,
        height: 40,
        marginHorizontal: 8,
    },
    typeToggle: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    typeBtnText: { fontSize: 14, fontWeight: '600' },
    input: {
        width: '100%',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        marginBottom: 16,
    },
    todayBtn: { alignSelf: 'flex-start', marginBottom: 10, marginTop: -10, paddingLeft: 2 },
    todayBtnText: { fontSize: 13, fontWeight: '600' },
    errorRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
    },
    errorText: { fontSize: 13, color: ERROR_TEXT, flex: 1 },
});
