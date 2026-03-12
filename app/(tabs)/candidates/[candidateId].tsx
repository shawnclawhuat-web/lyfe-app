import ActivityEntry from '@/components/candidates/ActivityEntry';
import ContactOutcomeSheet from '@/components/candidates/ContactOutcomeSheet';
import { AddDocumentSheet, DocumentList } from '@/components/candidates/DocumentSection';
import InterviewSchedulerSheet from '@/components/candidates/InterviewSchedulerSheet';
import InterviewCard from '@/components/InterviewCard';
import LoadingState from '@/components/LoadingState';
import ProgressSummaryCard from '@/components/roadmap/ProgressSummaryCard';
import UnlockConfirmSheet from '@/components/roadmap/UnlockConfirmSheet';
import ScreenHeader from '@/components/ScreenHeader';
import StatusStepper from '@/components/StatusStepper';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useContactOutcome } from '@/hooks/useContactOutcome';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import { useInterviewScheduler } from '@/hooks/useInterviewScheduler';
import { addCandidateActivity, fetchCandidate } from '@/lib/recruitment';
import { fetchCandidateRoadmap, unlockProgrammeForCandidate } from '@/lib/roadmap';
import { timeAgo } from '@/lib/dateTime';
import {
    CANDIDATE_STATUS_CONFIG,
    type CandidateActivity,
    type Interview,
    type RecruitmentCandidate,
} from '@/types/recruitment';
import type { ProgrammeWithModules } from '@/types/roadmap';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { KAV_BEHAVIOR, letterSpacing } from '@/constants/platform';
import { formatCreatedAt } from '@/lib/dateTime';
import { WebView } from 'react-native-webview';
let Clipboard: typeof import('expo-clipboard') | null = null;
try {
    Clipboard = require('expo-clipboard');
} catch (e) {
    if (__DEV__) console.warn('expo-clipboard not available:', e);
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

    // ── Roadmap ──
    const role = user?.role ?? '';
    const canMarkComplete = role === 'admin' || role === 'pa' || role === 'manager' || role === 'director';
    const [programmes, setProgrammes] = useState<ProgrammeWithModules[]>([]);
    const [showUnlockSheet, setShowUnlockSheet] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);

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

    // ── Bottom-sheet spring animations ──
    const confirmSheetY = useSharedValue(400);
    const noteSheetY = useSharedValue(400);
    const scheduleSheetY = useSharedValue(400);
    const addDocSheetY = useSharedValue(400);

    useEffect(() => {
        confirmSheetY.value = showConfirmSheet
            ? withSpring(0, { damping: 22, stiffness: 220 })
            : withSpring(400, { damping: 22, stiffness: 220 });
    }, [showConfirmSheet, confirmSheetY]);

    useEffect(() => {
        noteSheetY.value = showNoteSheet
            ? withSpring(0, { damping: 22, stiffness: 220 })
            : withSpring(400, { damping: 22, stiffness: 220 });
    }, [showNoteSheet, noteSheetY]);

    useEffect(() => {
        scheduleSheetY.value = showScheduleSheet
            ? withSpring(0, { damping: 22, stiffness: 220 })
            : withSpring(400, { damping: 22, stiffness: 220 });
    }, [showScheduleSheet, scheduleSheetY]);

    useEffect(() => {
        addDocSheetY.value = showAddDoc
            ? withSpring(0, { damping: 22, stiffness: 220 })
            : withSpring(400, { damping: 22, stiffness: 220 });
    }, [showAddDoc, addDocSheetY]);

    const confirmSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: confirmSheetY.value }] }));
    const noteSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: noteSheetY.value }] }));
    const scheduleSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scheduleSheetY.value }] }));
    const addDocSheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: addDocSheetY.value }] }));

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

    // Load roadmap summary (only relevant for PA/manager/director)
    const loadRoadmap = useCallback(async () => {
        if (!candidateId || !canMarkComplete) return;
        const { data } = await fetchCandidateRoadmap(candidateId);
        if (data) setProgrammes(data);
    }, [candidateId, canMarkComplete]);

    useEffect(() => {
        loadRoadmap();
    }, [loadRoadmap]);

    const handleUnlockConfirm = useCallback(async () => {
        if (!canMarkComplete || !user?.id || !candidateId) return;
        const sproutProgramme = programmes.find((p) => p.slug === 'sproutlyfe');
        if (!sproutProgramme) return;
        setIsUnlocking(true);
        setUnlockError(null);
        const { error: unlockErr } = await unlockProgrammeForCandidate(candidateId, sproutProgramme.id, user.id);
        setIsUnlocking(false);
        if (unlockErr) {
            setUnlockError(unlockErr);
        } else {
            setShowUnlockSheet(false);
            await loadRoadmap();
        }
    }, [user?.id, candidateId, programmes, loadRoadmap]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <ScreenHeader showBack backLabel="Candidates" title="Loading..." />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (!candidate) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
                    <QuickAction
                        icon="call"
                        label="Call"
                        color={colors.success}
                        bgColor={colors.successLight}
                        onPress={handleCall}
                    />
                    <QuickAction
                        icon="logo-whatsapp"
                        label="WhatsApp"
                        color={colors.success}
                        bgColor={colors.successLight}
                        onPress={handleWhatsApp}
                    />
                    <QuickAction
                        icon="calendar"
                        label="Schedule"
                        color={colors.warning}
                        bgColor={colors.warningLight}
                        onPress={openNewInterview}
                    />
                    <QuickAction
                        icon="create-outline"
                        label="Note"
                        color={colors.textTertiary}
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

                    <DocumentList
                        documents={documents}
                        hasDocumentPicker={hasDocumentPicker}
                        colors={colors}
                        onViewDocument={handleViewDocument}
                        onDeleteDocument={handleDeleteDocument}
                        onAddDocument={openAddDocSheet}
                    />
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

                {/* Development Roadmap — PA / Manager / Director only */}
                {canMarkComplete && programmes.length > 0 && (
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.cardBackground,
                                borderColor: colors.cardBorder,
                                padding: 0,
                                overflow: 'hidden',
                            },
                        ]}
                    >
                        <ProgressSummaryCard
                            programmes={programmes}
                            onViewFull={() => router.push(`/(tabs)/candidates/progress/${candidateId}` as any)}
                            colors={colors}
                        />
                        {/* Unlock SproutLYFE button — shown when SproutLYFE is locked and not yet manually unlocked */}
                        {programmes.some((p) => p.slug === 'sproutlyfe' && p.isLocked) && (
                            <View style={[styles.unlockRow, { borderTopColor: colors.border }]}>
                                {unlockError && (
                                    <Text style={[styles.unlockError, { color: colors.danger }]}>{unlockError}</Text>
                                )}
                                <TouchableOpacity
                                    style={[styles.unlockBtn, { borderColor: colors.accent }]}
                                    onPress={() => {
                                        setUnlockError(null);
                                        setShowUnlockSheet(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="lock-open-outline" size={15} color={colors.accent} />
                                    <Text style={[styles.unlockBtnText, { color: colors.accent }]}>
                                        Unlock SproutLYFE
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

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
            <ContactOutcomeSheet
                visible={showConfirmSheet}
                colors={colors}
                animatedStyle={confirmSheetStyle}
                pendingType={pendingType}
                confirmStep={confirmStep}
                selectedOutcome={selectedOutcome}
                noteText={noteText}
                candidateName={candidate.name}
                candidatePhone={candidate.phone}
                onNoteTextChange={setNoteText}
                onOutcomeSelect={handleOutcomeSelect}
                onSaveActivity={handleSaveActivity}
                onDismiss={handleDismissSheet}
            />

            {/* Note Sheet */}
            <Modal
                visible={showNoteSheet}
                transparent
                animationType="none"
                onRequestClose={() => setShowNoteSheet(false)}
            >
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={KAV_BEHAVIOR}>
                    <TouchableOpacity
                        style={sheetStyles.overlay}
                        activeOpacity={1}
                        onPress={() => setShowNoteSheet(false)}
                    >
                        <Animated.View
                            style={[sheetStyles.sheet, { backgroundColor: colors.cardBackground }, noteSheetStyle]}
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
                                <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                                <Text style={[sheetStyles.primaryBtnText, { color: colors.textInverse }]}>
                                    Save Note
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Schedule Interview Sheet */}
            <InterviewSchedulerSheet
                visible={showScheduleSheet}
                colors={colors}
                animatedStyle={scheduleSheetStyle}
                editingInterview={editingInterview}
                candidateInterviewCount={candidate?.interviews.length ?? 0}
                scheduleDate={scheduleDate}
                scheduleHour={scheduleHour}
                scheduleMinute={scheduleMinute}
                scheduleAmPm={scheduleAmPm}
                scheduleType={scheduleType}
                scheduleLink={scheduleLink}
                scheduleLocation={scheduleLocation}
                scheduleNotes={scheduleNotes}
                scheduleStatus={scheduleStatus}
                scheduleError={scheduleError}
                isScheduling={isScheduling}
                onDateChange={setScheduleDate}
                onHourChange={setScheduleHour}
                onMinuteChange={setScheduleMinute}
                onAmPmChange={setScheduleAmPm}
                onTypeChange={setScheduleType}
                onLinkChange={setScheduleLink}
                onLocationChange={setScheduleLocation}
                onNotesChange={setScheduleNotes}
                onStatusChange={setScheduleStatus}
                onSubmit={handleSubmitSchedule}
                onDismiss={dismissScheduleSheet}
            />

            {/* Add Document Sheet */}
            <AddDocumentSheet
                visible={showAddDoc}
                colors={colors}
                animatedStyle={addDocSheetStyle}
                addDocStep={addDocStep}
                addDocLabel={addDocLabel}
                addDocCustomLabel={addDocCustomLabel}
                addDocError={addDocError}
                onClose={() => setShowAddDoc(false)}
                onSelectLabel={handleSelectLabel}
                onCustomLabelChange={setAddDocCustomLabel}
                onPickAndUpload={pickAndUploadDocument}
            />

            {/* PDF Viewer Modal */}
            <Modal visible={showPdf} animationType="slide" onRequestClose={() => setShowPdf(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.textPrimary }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: colors.surfacePrimary,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setShowPdf(false)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="chevron-down" size={24} color={colors.textInverse} />
                        </TouchableOpacity>
                        <Text
                            style={{
                                flex: 1,
                                color: colors.textInverse,
                                fontSize: 15,
                                fontWeight: '600',
                                textAlign: 'center',
                            }}
                            numberOfLines={1}
                        >
                            {pdfTitle}
                        </Text>
                        <View style={{ width: 32 }} />
                    </View>
                    {pdfUrl && <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} originWhitelist={['*']} />}
                </SafeAreaView>
            </Modal>

            {/* Unlock SproutLYFE Confirmation Sheet */}
            <UnlockConfirmSheet
                visible={showUnlockSheet}
                candidateName={candidate?.name ?? ''}
                programmeName="SproutLYFE"
                isUnlocking={isUnlocking}
                onConfirm={handleUnlockConfirm}
                onCancel={() => setShowUnlockSheet(false)}
                colors={colors}
            />
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
    profileName: { fontSize: 20, fontWeight: '800', letterSpacing: letterSpacing(-0.3) },
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
    unlockRow: {
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: 12,
        gap: 8,
    },
    unlockError: {
        fontSize: 13,
        textAlign: 'center',
    },
    unlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
    },
    unlockBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

// ── Note Sheet Styles (used by the remaining inline Note Sheet) ──

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
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: letterSpacing(-0.3),
        marginBottom: 20,
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
        fontSize: 16,
        fontWeight: '700',
    },
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
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
});
