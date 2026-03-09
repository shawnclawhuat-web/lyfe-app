import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import LeadActivityItem from '@/components/LeadActivityItem';
import LoadingState from '@/components/LoadingState';
import ScreenHeader from '@/components/ScreenHeader';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import {
    addLeadActivity,
    addLeadNote,
    fetchLead,
    fetchLeadActivities,
    fetchTeamAgents,
    reassignLead,
    updateLeadStatus,
} from '@/lib/leads';
import type { Lead } from '@/types/lead';
import {
    LEAD_STATUSES,
    PRODUCT_LABELS,
    SOURCE_LABELS,
    STATUS_CONFIG,
    type LeadActivity,
    type LeadStatus,
} from '@/types/lead';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AppState,
    KeyboardAvoidingView,
    Linking,
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

export default function LeadDetailScreen() {
    const { leadId } = useLocalSearchParams<{ leadId: string }>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const { viewMode, canToggle } = useViewMode();
    const router = useRouter();
    const isManagerView = canToggle && viewMode === 'manager';

    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<LeadActivity[]>([]);
    const [currentStatus, setCurrentStatus] = useState<LeadStatus>('new');
    const [isLoading, setIsLoading] = useState(true);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [reassignAgents, setReassignAgents] = useState<{ id: string; full_name: string }[]>([]);
    const [isReassigning, setIsReassigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Contact confirmation (AppState-based)
    const [pendingContact, setPendingContact] = useState<{ type: 'call' | 'whatsapp'; phone: string } | null>(null);
    const [showContactConfirm, setShowContactConfirm] = useState(false);
    const hasPendingContact = useRef(false);
    const wentToBackground = useRef(false);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'background') {
                wentToBackground.current = true;
            } else if (nextState === 'active' && wentToBackground.current && hasPendingContact.current) {
                wentToBackground.current = false;
                setShowContactConfirm(true);
            }
        });
        return () => subscription.remove();
    }, []);

    const loadData = useCallback(async () => {
        if (!leadId) return;

        try {
            setError(null);
            const [leadResult, activitiesResult] = await Promise.all([fetchLead(leadId), fetchLeadActivities(leadId)]);

            if (leadResult.data) {
                setLead(leadResult.data);
                setCurrentStatus(leadResult.data.status);
            }
            if (leadResult.error) {
                setError('Failed to load lead details');
            }
            if (activitiesResult.data) {
                setActivities(activitiesResult.data);
            }
        } catch {
            setError('Failed to load lead details');
        }
        setIsLoading(false);
    }, [leadId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader showBack backLabel="Leads" title="Loading..." />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (!lead) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Lead not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.accent, fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const logActivity = (type: 'call' | 'whatsapp', description: string, metadata: Record<string, any>) => {
        const optimistic: LeadActivity = {
            id: `a_${Date.now()}`,
            lead_id: lead.id,
            user_id: user?.id || 'me',
            type,
            description,
            metadata,
            created_at: new Date().toISOString(),
            actor_name: user?.full_name || undefined,
        };
        setActivities((prev) => [optimistic, ...prev]);
        if (user?.id) {
            addLeadActivity(lead.id, user.id, type, description, metadata);
        }
    };

    const handleCall = () => {
        if (!lead.phone) return;
        hasPendingContact.current = true;
        setPendingContact({ type: 'call', phone: lead.phone });
        Linking.openURL(`tel:${lead.phone.replace(/\s/g, '')}`);
    };

    const handleWhatsApp = () => {
        if (!lead.phone) return;
        hasPendingContact.current = true;
        setPendingContact({ type: 'whatsapp', phone: lead.phone });
        const phone = lead.phone.replace(/[\s+]/g, '');
        Linking.openURL(`https://wa.me/${phone}`);
    };

    const handleContactConfirm = (outcome: 'reached' | 'no_answer' | 'sent' | 'skip') => {
        const pc = pendingContact;
        hasPendingContact.current = false;
        setPendingContact(null);
        setShowContactConfirm(false);
        if (!pc || outcome === 'skip') return;

        const description =
            pc.type === 'call'
                ? outcome === 'reached'
                    ? `Called ${pc.phone} — reached`
                    : `Called ${pc.phone} — no answer`
                : `Sent WhatsApp to ${pc.phone}`;

        logActivity(pc.type, description, { phone: pc.phone, outcome });

        // Auto-advance: New → Contacted on any logged contact attempt
        if (currentStatus === 'new') {
            handleChangeStatus('contacted');
        }
    };

    const handleOpenReassign = async () => {
        if (user?.id) {
            const { data } = await fetchTeamAgents(user.id);
            setReassignAgents(data.filter((a) => a.id !== lead.assigned_to));
        }
        setShowReassignModal(true);
    };

    const handleReassign = async (toAgent: { id: string; full_name: string }) => {
        if (!lead) return;
        const fromId = lead.assigned_to;
        const fromName = fromId;

        const newActivity: LeadActivity = {
            id: `a_${Date.now()}`,
            lead_id: lead.id,
            user_id: user?.id || 'me',
            type: 'reassignment',
            description: null,
            metadata: {
                from_agent_id: fromId,
                to_agent_id: toAgent.id,
                from_agent_name: fromName,
                to_agent_name: toAgent.full_name,
            },
            created_at: new Date().toISOString(),
            actor_name: user?.full_name || undefined,
        };

        setShowReassignModal(false);

        if (!user?.id) return;
        setIsReassigning(true);
        const { error } = await reassignLead(lead.id, toAgent.id, fromId, fromName, toAgent.full_name, user.id);
        setIsReassigning(false);
        if (!error) {
            setActivities((prev) => [newActivity, ...prev]);
        } else {
            if (__DEV__) console.error('Failed to reassign:', error);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        if (!user?.id) return;
        setIsSavingNote(true);
        const { data, error } = await addLeadNote(lead.id, noteText.trim(), user.id);
        setIsSavingNote(false);

        if (data) {
            setActivities((prev) => [data, ...prev]);
            setNoteText('');
            setShowNoteInput(false);
        } else if (error) {
            setError('Failed to add note');
            if (__DEV__) console.error('Failed to add note:', error);
        }
    };

    const handleChangeStatus = async (newStatus: LeadStatus) => {
        if (newStatus === currentStatus) return;

        const previousStatus = currentStatus;

        if (!user?.id) return;

        // Optimistic update — close picker and show new status immediately
        setCurrentStatus(newStatus);
        setShowStatusPicker(false);
        setIsUpdatingStatus(true);

        const { error } = await updateLeadStatus(lead.id, newStatus, previousStatus, user.id);
        setIsUpdatingStatus(false);

        if (!error) {
            // Re-fetch activities to get the persisted status_change entry
            const { data: updatedActivities } = await fetchLeadActivities(lead.id);
            if (updatedActivities) setActivities(updatedActivities);
        } else {
            // Rollback on failure
            setCurrentStatus(previousStatus);
            setError('Failed to update status');
            if (__DEV__) console.error('Failed to update status:', error);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Bar */}
            <ScreenHeader
                showBack
                backLabel="Leads"
                title={lead.full_name}
                banner={
                    isManagerView
                        ? {
                              text: 'Manager View — Limited actions available.',
                              icon: 'shield-outline',
                          }
                        : undefined
                }
            />

            {error && <ErrorBanner message={error} onRetry={loadData} onDismiss={() => setError(null)} />}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Lead Header Card */}
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        <View style={styles.leadHeaderRow}>
                            <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
                                <Text style={[styles.avatarText, { color: colors.accent }]}>
                                    {lead.full_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.leadInfo}>
                                <Text style={[styles.leadName, { color: colors.textPrimary }]}>{lead.full_name}</Text>
                                <View style={{ marginTop: 4 }}>
                                    <StatusBadge status={currentStatus} size="medium" />
                                </View>
                            </View>
                        </View>

                        {/* Contact Info */}
                        <View style={[styles.contactSection, { borderTopColor: colors.borderLight }]}>
                            {lead.phone && (
                                <View style={styles.contactRow}>
                                    <Ionicons name="call-outline" size={16} color={colors.textTertiary} />
                                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                        {lead.phone}
                                    </Text>
                                </View>
                            )}
                            {lead.email && (
                                <View style={styles.contactRow}>
                                    <Ionicons name="mail-outline" size={16} color={colors.textTertiary} />
                                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                        {lead.email}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.tagsRow}>
                                <View style={[styles.infoTag, { backgroundColor: colors.surfacePrimary }]}>
                                    <Ionicons name="shield-outline" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.infoTagText, { color: colors.textSecondary }]}>
                                        {PRODUCT_LABELS[lead.product_interest]}
                                    </Text>
                                </View>
                                <View style={[styles.infoTag, { backgroundColor: colors.surfacePrimary }]}>
                                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.infoTagText, { color: colors.textSecondary }]}>
                                        {SOURCE_LABELS[lead.source]}
                                    </Text>
                                </View>
                            </View>
                        </View>
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
                            disabled={!lead.phone}
                        />
                        <QuickAction
                            icon="logo-whatsapp"
                            label="WhatsApp"
                            color={colors.success}
                            bgColor={colors.successLight}
                            onPress={handleWhatsApp}
                            disabled={!lead.phone}
                        />
                        {isManagerView ? (
                            <QuickAction
                                icon="git-compare-outline"
                                label="Reassign"
                                color={colors.statusProposed}
                                bgColor={colors.surfacePrimary}
                                onPress={handleOpenReassign}
                                disabled={isReassigning}
                            />
                        ) : (
                            <>
                                <QuickAction
                                    icon="swap-horizontal"
                                    label="Status"
                                    color={colors.warning}
                                    bgColor={colors.warningLight}
                                    onPress={() => setShowStatusPicker(!showStatusPicker)}
                                />
                                <QuickAction
                                    icon="create-outline"
                                    label="Note"
                                    color={colors.textTertiary}
                                    bgColor={colors.surfacePrimary}
                                    onPress={() => setShowNoteInput(!showNoteInput)}
                                />
                            </>
                        )}
                    </View>

                    {/* Status Picker */}
                    {!isManagerView && showStatusPicker && (
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                            ]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Change Status</Text>
                            <View style={styles.statusGrid}>
                                {LEAD_STATUSES.map((s) => {
                                    const cfg = STATUS_CONFIG[s];
                                    const isActive = s === currentStatus;
                                    return (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.statusOption,
                                                {
                                                    backgroundColor: isActive ? cfg.bgColor : colors.surfacePrimary,
                                                    borderColor: isActive ? cfg.color : colors.borderLight,
                                                    borderWidth: isActive ? 1.5 : 0.5,
                                                    opacity: isUpdatingStatus ? 0.5 : 1,
                                                },
                                            ]}
                                            onPress={() => handleChangeStatus(s)}
                                            disabled={isUpdatingStatus}
                                        >
                                            <Ionicons
                                                name={cfg.icon as any}
                                                size={16}
                                                color={isActive ? cfg.color : colors.textTertiary}
                                            />
                                            <Text
                                                style={[
                                                    styles.statusOptionText,
                                                    { color: isActive ? cfg.color : colors.textSecondary },
                                                ]}
                                            >
                                                {cfg.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Add Note Input */}
                    {!isManagerView && showNoteInput && (
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                            ]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Add Note</Text>
                            <TextInput
                                style={[
                                    styles.noteInput,
                                    {
                                        color: colors.textPrimary,
                                        borderColor: colors.borderLight,
                                        backgroundColor: colors.surfacePrimary,
                                    },
                                ]}
                                placeholder="Write a note..."
                                placeholderTextColor={colors.textTertiary}
                                value={noteText}
                                onChangeText={setNoteText}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                            <View style={styles.noteActions}>
                                <TouchableOpacity
                                    style={[styles.noteCancel, { borderColor: colors.borderLight }]}
                                    onPress={() => {
                                        setShowNoteInput(false);
                                        setNoteText('');
                                    }}
                                >
                                    <Text style={[styles.noteCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.noteSave,
                                        {
                                            backgroundColor: colors.accent,
                                            opacity: noteText.trim() && !isSavingNote ? 1 : 0.4,
                                        },
                                    ]}
                                    onPress={handleAddNote}
                                    disabled={!noteText.trim() || isSavingNote}
                                >
                                    <Text style={[styles.noteSaveText, { color: colors.textInverse }]}>
                                        {isSavingNote ? 'Saving...' : 'Save Note'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Activity Timeline */}
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        <View style={styles.timelineHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Activity</Text>
                            <Text style={[styles.activityCount, { color: colors.textTertiary }]}>
                                {activities.length} entries
                            </Text>
                        </View>
                        <View style={styles.timelineContent}>
                            {activities.map((act, idx) => (
                                <LeadActivityItem key={act.id} activity={act} isLast={idx === activities.length - 1} />
                            ))}
                            {activities.length === 0 && (
                                <EmptyState
                                    icon="time-outline"
                                    title="No activity yet"
                                    subtitle="Activity will appear here as you work this lead"
                                />
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Contact Confirm Modal */}
            <Modal
                visible={showContactConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => handleContactConfirm('skip')}
            >
                <View style={styles.confirmOverlay}>
                    <View style={[styles.confirmSheet, { backgroundColor: colors.cardBackground }]}>
                        {pendingContact?.type === 'call' ? (
                            <>
                                <View style={[styles.confirmIconWrap, { backgroundColor: '#DCFCE7' }]}>
                                    <Ionicons name="call" size={26} color="#16A34A" />
                                </View>
                                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                                    How did the call go?
                                </Text>
                                <Text style={[styles.confirmSubtitle, { color: colors.textSecondary }]}>
                                    With {lead.full_name}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: '#16A34A' }]}
                                    onPress={() => handleContactConfirm('reached')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.confirmBtnText}>Reached them</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        {
                                            backgroundColor: colors.surfacePrimary,
                                            borderWidth: 0.5,
                                            borderColor: colors.borderLight,
                                        },
                                    ]}
                                    onPress={() => handleContactConfirm('no_answer')}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
                                    <Text style={[styles.confirmBtnText, { color: colors.textSecondary }]}>
                                        No answer
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={[styles.confirmIconWrap, { backgroundColor: '#D1FAE5' }]}>
                                    <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                                </View>
                                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
                                    Did you send the message?
                                </Text>
                                <Text style={[styles.confirmSubtitle, { color: colors.textSecondary }]}>
                                    To {lead.full_name}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: '#25D366' }]}
                                    onPress={() => handleContactConfirm('sent')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.confirmBtnText}>Yes, sent</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <TouchableOpacity onPress={() => handleContactConfirm('skip')}>
                            <Text style={[styles.confirmSkip, { color: colors.textTertiary }]}>Skip — don't log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Reassign Modal */}
            <Modal
                visible={showReassignModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReassignModal(false)}
            >
                <TouchableOpacity
                    style={[styles.modalOverlay]}
                    activeOpacity={1}
                    onPress={() => setShowReassignModal(false)}
                >
                    <View style={[styles.reassignSheet, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.reassignTitle, { color: colors.textPrimary }]}>Reassign Lead</Text>
                        <Text style={[styles.reassignSubtitle, { color: colors.textSecondary }]}>
                            Select an agent to reassign {lead.full_name} to
                        </Text>
                        {reassignAgents.length === 0 ? (
                            <Text style={[styles.reassignEmpty, { color: colors.textTertiary }]}>
                                No agents available
                            </Text>
                        ) : (
                            reassignAgents.map((agent) => (
                                <TouchableOpacity
                                    key={agent.id}
                                    style={[styles.agentRow, { borderColor: colors.borderLight }]}
                                    onPress={() => handleReassign(agent)}
                                >
                                    <View style={[styles.agentAvatar, { backgroundColor: colors.accentLight }]}>
                                        <Text style={[styles.agentAvatarText, { color: colors.accent }]}>
                                            {agent.full_name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.agentName, { color: colors.textPrimary }]}>
                                        {agent.full_name}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity
                            style={[styles.reassignCancel, { borderColor: colors.borderLight }]}
                            onPress={() => setShowReassignModal(false)}
                        >
                            <Text style={[styles.reassignCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    leadHeaderRow: {
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
    leadInfo: { flex: 1 },
    leadName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    contactSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 0.5,
        gap: 6,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: { fontSize: 14 },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    infoTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    infoTagText: { fontSize: 12, fontWeight: '500' },
    actionsCard: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 12,
        marginBottom: 12,
        justifyContent: 'space-around',
    },
    quickAction: {
        alignItems: 'center',
        gap: 4,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: { fontSize: 11, fontWeight: '600' },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusOptionText: { fontSize: 13, fontWeight: '600' },
    noteInput: {
        borderWidth: 0.5,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
    },
    noteActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 10,
    },
    noteCancel: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 0.5,
    },
    noteCancelText: { fontSize: 13, fontWeight: '600' },
    noteSave: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    noteSaveText: { fontSize: 13, fontWeight: '700' },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activityCount: { fontSize: 12 },
    timelineContent: { marginTop: 4 },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    notFoundText: { fontSize: 16, fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    reassignSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        gap: 0,
    },
    reassignTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
    reassignSubtitle: { fontSize: 13, marginBottom: 20 },
    reassignEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
    agentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    agentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    agentAvatarText: { fontSize: 15, fontWeight: '700' },
    agentName: { flex: 1, fontSize: 15, fontWeight: '600' },
    reassignCancel: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 0.5,
        alignItems: 'center',
    },
    reassignCancelText: { fontSize: 15, fontWeight: '600' },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    confirmSheet: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        gap: 0,
    },
    confirmIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    confirmTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    confirmSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
    confirmBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 12,
        marginBottom: 10,
    },
    confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    confirmSkip: { fontSize: 13, marginTop: 4, fontWeight: '500' },
});
