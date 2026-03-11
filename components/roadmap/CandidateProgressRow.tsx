import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Touchable from '@/components/Touchable';
import type { RoadmapModuleWithProgress } from '@/types/roadmap';
import { MODULE_TYPE_CONFIG, MODULE_TYPE_COLOR_KEY } from '@/types/roadmap';
import { displayWeight, letterSpacing } from '@/constants/platform';
import type { ThemeColors } from '@/types/theme';

interface Props {
    module: RoadmapModuleWithProgress;
    /** Whether the reviewer has permission to toggle completion. */
    canMarkComplete: boolean;
    /** Whether this row is currently being edited for notes. */
    isEditingNote: boolean;
    /** The current note text (used when editing). */
    noteText: string;
    onToggleComplete: () => void;
    onOpenNoteEditor: () => void;
    onCloseNoteEditor: () => void;
    onNoteChange: (text: string) => void;
    onSaveNote: () => void;
    colors: ThemeColors;
}

/**
 * A single module row for the management progress view (CandidateProgressView).
 *
 * States:
 * - Active module: completion toggle + title + type + note icon + inline note editor
 * - Disabled module (is_active = false): greyed, "Disabled" badge, no toggle, progress preserved
 * - Archived module: never rendered (filtered by parent)
 */
function CandidateProgressRow({
    module,
    canMarkComplete,
    isEditingNote,
    noteText,
    onToggleComplete,
    onOpenNoteEditor,
    onCloseNoteEditor,
    onNoteChange,
    onSaveNote,
    colors,
}: Props) {
    const isCompleted = module.progress?.status === 'completed';
    const isDisabled = !module.is_active;
    const typeConfig = MODULE_TYPE_CONFIG[module.module_type];
    const typeColor = colors[MODULE_TYPE_COLOR_KEY[module.module_type]];

    const rowOpacity = isDisabled ? 0.5 : 1;

    return (
        <View style={[styles.container, { borderBottomColor: colors.border, opacity: rowOpacity }]}>
            <View style={styles.main}>
                {/* Completion toggle — disabled modules show read-only icon, no toggle */}
                {canMarkComplete && !isDisabled ? (
                    <Touchable
                        onPress={onToggleComplete}
                        activeOpacity={0.7}
                        hitSlop={8}
                        accessibilityLabel={`Mark ${module.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
                    >
                        <Ionicons
                            name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isCompleted ? colors.success : colors.textTertiary}
                        />
                    </Touchable>
                ) : (
                    <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isCompleted ? colors.success : colors.textTertiary}
                    />
                )}

                {/* Module info */}
                <View style={styles.info}>
                    <Text
                        style={[
                            styles.title,
                            { color: isDisabled ? colors.textTertiary : colors.textPrimary },
                            isCompleted && !isDisabled && styles.titleCompleted,
                        ]}
                        numberOfLines={2}
                    >
                        {module.title}
                    </Text>

                    <View style={styles.metaRow}>
                        {/* Type badge */}
                        <Text style={[styles.typeLabel, { color: typeColor }]}>{typeConfig.label}</Text>

                        {/* Disabled badge */}
                        {isDisabled && (
                            <View style={[styles.disabledBadge, { backgroundColor: colors.border }]}>
                                <Text style={[styles.disabledText, { color: colors.textTertiary }]}>Disabled</Text>
                            </View>
                        )}

                        {/* Archived badge — shown when parent opts in */}
                        {module.isArchived && (
                            <View style={[styles.archivedBadge, { backgroundColor: colors.border }]}>
                                <Text style={[styles.archivedText, { color: colors.textTertiary }]}>Archived</Text>
                            </View>
                        )}

                        {/* Exam score */}
                        {module.progress?.score != null && (
                            <Text style={[styles.score, { color: colors.textSecondary }]}>
                                Score: {module.progress.score}%
                            </Text>
                        )}
                    </View>
                </View>

                {/* Note icon — only for active, non-archived modules */}
                {!isDisabled && !module.isArchived && (
                    <Touchable
                        onPress={() => {
                            if (isEditingNote) {
                                onCloseNoteEditor();
                            } else {
                                onOpenNoteEditor();
                            }
                        }}
                        activeOpacity={0.7}
                        accessibilityLabel={`${isEditingNote ? 'Close' : 'Add'} note for ${module.title}`}
                    >
                        <Ionicons
                            name={module.progress?.notes ? 'chatbubble' : 'chatbubble-outline'}
                            size={18}
                            color={module.progress?.notes ? colors.accent : colors.textTertiary}
                        />
                    </Touchable>
                )}
            </View>

            {/* Inline note editor */}
            {isEditingNote && (
                <View style={styles.noteEditor}>
                    <TextInput
                        style={[
                            styles.noteInput,
                            {
                                color: colors.textPrimary,
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                            },
                        ]}
                        value={noteText}
                        onChangeText={onNoteChange}
                        placeholder="Add a note..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    <View style={styles.noteActions}>
                        <Touchable onPress={onCloseNoteEditor} activeOpacity={0.7}>
                            <Text style={[styles.noteCancel, { color: colors.textTertiary }]}>Cancel</Text>
                        </Touchable>
                        <Touchable onPress={onSaveNote} activeOpacity={0.7}>
                            <Text style={[styles.noteSave, { color: colors.accent }]}>Save</Text>
                        </Touchable>
                    </View>
                </View>
            )}

            {/* Existing note display (read mode) */}
            {!isEditingNote && module.progress?.notes ? (
                <Text style={[styles.existingNote, { color: colors.textSecondary }]}>{module.progress.notes}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    main: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: letterSpacing(-0.1),
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 3,
        flexWrap: 'wrap',
    },
    typeLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    disabledBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    disabledText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    archivedBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    archivedText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    score: {
        fontSize: 11,
    },
    noteEditor: {
        marginTop: 8,
        marginLeft: 32,
    },
    noteInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        lineHeight: 18,
        minHeight: 60,
    },
    noteActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 8,
    },
    noteCancel: {
        fontSize: 14,
    },
    noteSave: {
        fontSize: 14,
        fontWeight: '600',
    },
    existingNote: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 32,
        fontStyle: 'italic',
        lineHeight: 16,
    },
});

export default React.memo(CandidateProgressRow);
