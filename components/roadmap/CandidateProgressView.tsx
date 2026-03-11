import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Touchable from '@/components/Touchable';
import ProgressSummaryCard from './ProgressSummaryCard';
import CandidateProgressRow from './CandidateProgressRow';
import UnlockConfirmSheet from './UnlockConfirmSheet';
import {
    fetchCandidateRoadmap,
    updateModuleProgress,
    updateModuleNotes,
    unlockProgrammeForCandidate,
} from '@/lib/roadmap';
import type { ProgrammeWithModules, RoadmapModuleWithProgress } from '@/types/roadmap';
import { displayWeight, letterSpacing } from '@/constants/platform';
import type { ThemeColors } from '@/types/theme';

interface Props {
    candidateId: string;
    candidateName: string;
    /** Current user performing the review */
    reviewerId: string;
    /** Can this role mark modules as complete? (PA, manager, director) */
    canMarkComplete: boolean;
    colors: ThemeColors;
    /** If true, show full detail view instead of summary card */
    expanded?: boolean;
    /**
     * When true, the internal section header (with back chevron) is hidden.
     * Use when the component is rendered inside a dedicated screen that
     * already provides its own ScreenHeader navigation.
     */
    hideHeader?: boolean;
    /** Called when "View Full Progress" is tapped in summary mode (for external navigation) */
    onViewFull?: () => void;
}

function CandidateProgressView({
    candidateId,
    candidateName,
    reviewerId,
    canMarkComplete,
    colors,
    expanded = false,
    hideHeader = false,
    onViewFull,
}: Props) {
    const [programmes, setProgrammes] = useState<ProgrammeWithModules[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedView, setExpandedView] = useState(expanded);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [unlockSheet, setUnlockSheet] = useState<{ programmeId: string; programmeName: string } | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);

    const [fetchError, setFetchError] = useState<string | null>(null);

    const loadProgress = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        // Management roles see disabled modules (greyed + "Disabled" badge); candidates do not
        const { data, error } = await fetchCandidateRoadmap(candidateId, { includeDisabled: canMarkComplete });
        if (error) {
            setFetchError(error);
        } else if (data) {
            setProgrammes(data);
        }
        setIsLoading(false);
    }, [candidateId, canMarkComplete]);

    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    const handleToggleComplete = useCallback(
        async (module: RoadmapModuleWithProgress) => {
            if (!canMarkComplete) return;
            const newStatus = module.progress?.status === 'completed' ? 'not_started' : 'completed';
            await updateModuleProgress(candidateId, module.id, newStatus, reviewerId);
            await loadProgress();
        },
        [candidateId, reviewerId, canMarkComplete, loadProgress],
    );

    const handleSaveNote = useCallback(
        async (moduleId: string) => {
            await updateModuleNotes(candidateId, moduleId, noteText);
            setEditingNoteId(null);
            setNoteText('');
            await loadProgress();
        },
        [candidateId, noteText, loadProgress],
    );

    const handleUnlockConfirm = useCallback(async () => {
        if (!unlockSheet) return;
        setIsUnlocking(true);
        setUnlockError(null);
        const { error } = await unlockProgrammeForCandidate(candidateId, unlockSheet.programmeId, reviewerId);
        setIsUnlocking(false);
        if (error) {
            setUnlockError(error);
        } else {
            setUnlockSheet(null);
            await loadProgress();
        }
    }, [unlockSheet, candidateId, reviewerId, loadProgress]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
            </View>
        );
    }

    if (fetchError) {
        return (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{fetchError}</Text>
            </View>
        );
    }

    if (programmes.length === 0) return null;

    // Summary card (default — embedded in candidate profile)
    if (!expandedView) {
        return (
            <ProgressSummaryCard
                programmes={programmes}
                onViewFull={onViewFull ?? (() => setExpandedView(true))}
                colors={colors}
            />
        );
    }

    // Expanded detail view
    return (
        <>
            <View style={styles.expandedContainer}>
                {!hideHeader && (
                    <View style={styles.expandedHeader}>
                        <Touchable onPress={() => setExpandedView(false)} activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={20} color={colors.accent} />
                        </Touchable>
                        <Text style={[styles.expandedTitle, { color: colors.textPrimary }]}>
                            {candidateName}'s Progress
                        </Text>
                    </View>
                )}

                {unlockError ? (
                    <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight }]}>
                        <Text style={[styles.errorText, { color: colors.danger }]}>{unlockError}</Text>
                    </View>
                ) : null}

                {programmes.map((programme) => {
                    // Only show active, non-archived modules in the list
                    const visibleModules = programme.modules.filter((m) => !m.isArchived);

                    return (
                        <View key={programme.id} style={styles.programmeSection}>
                            <View style={styles.programmeTitleRow}>
                                <View
                                    style={[
                                        styles.programmeDot,
                                        {
                                            backgroundColor:
                                                programme.icon_type === 'seedling'
                                                    ? colors.seedLyfe
                                                    : colors.sproutLyfe,
                                        },
                                    ]}
                                />
                                <Text style={[styles.programmeTitle, { color: colors.textPrimary }]}>
                                    {programme.title}
                                </Text>
                                <Text style={[styles.programmeStats, { color: colors.textTertiary }]}>
                                    {programme.completedCount}/{programme.totalCount}
                                </Text>
                            </View>

                            {/* Manual unlock button for locked programmes */}
                            {programme.isLocked && canMarkComplete && (
                                <Touchable
                                    style={[
                                        styles.unlockButton,
                                        { backgroundColor: colors.accent + '14', borderColor: colors.accent + '30' },
                                    ]}
                                    onPress={() =>
                                        setUnlockSheet({ programmeId: programme.id, programmeName: programme.title })
                                    }
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="lock-open-outline" size={16} color={colors.accent} />
                                    <Text style={[styles.unlockButtonText, { color: colors.accent }]}>
                                        Unlock {programme.title} Early
                                    </Text>
                                </Touchable>
                            )}

                            {visibleModules.map((module) => (
                                <CandidateProgressRow
                                    key={module.id}
                                    module={module}
                                    canMarkComplete={canMarkComplete}
                                    isEditingNote={editingNoteId === module.id}
                                    noteText={editingNoteId === module.id ? noteText : ''}
                                    onToggleComplete={() => handleToggleComplete(module)}
                                    onOpenNoteEditor={() => {
                                        setEditingNoteId(module.id);
                                        setNoteText(module.progress?.notes ?? '');
                                    }}
                                    onCloseNoteEditor={() => {
                                        setEditingNoteId(null);
                                        setNoteText('');
                                    }}
                                    onNoteChange={setNoteText}
                                    onSaveNote={() => handleSaveNote(module.id)}
                                    colors={colors}
                                />
                            ))}
                        </View>
                    );
                })}
            </View>

            <UnlockConfirmSheet
                visible={unlockSheet !== null}
                candidateName={candidateName}
                programmeName={unlockSheet?.programmeName ?? ''}
                isUnlocking={isUnlocking}
                onConfirm={handleUnlockConfirm}
                onCancel={() => {
                    if (!isUnlocking) setUnlockSheet(null);
                }}
                colors={colors}
            />
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    expandedContainer: {
        gap: 16,
    },
    expandedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 8,
    },
    expandedTitle: {
        fontSize: 17,
        fontWeight: displayWeight('600'),
        letterSpacing: letterSpacing(-0.2),
    },
    errorBanner: {
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        fontSize: 13,
        lineHeight: 18,
    },
    programmeSection: {
        gap: 0,
    },
    programmeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    programmeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    programmeTitle: {
        fontSize: 16,
        fontWeight: displayWeight('600'),
        flex: 1,
    },
    programmeStats: {
        fontSize: 13,
    },
    unlockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 12,
    },
    unlockButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default React.memo(CandidateProgressView);
