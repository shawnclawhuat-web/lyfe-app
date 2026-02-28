import { useTheme } from '@/contexts/ThemeContext';
import type { ExamPaper, PaperStats } from '@/types/exam';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExamCardProps {
    paper: ExamPaper;
    stats: PaperStats | null;
    onPress: () => void;
    disabled?: boolean;
}

export default function ExamCard({ paper, stats, onPress, disabled }: ExamCardProps) {
    const { colors } = useTheme();

    const hasAttempts = stats && stats.attemptCount > 0;
    const bestPassed = stats?.bestPassed === true;

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: bestPassed ? colors.success : colors.cardBorder,
                    borderWidth: bestPassed ? 1.5 : 0.5,
                    opacity: disabled ? 0.5 : 1,
                },
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${paper.code} exam: ${paper.title}. ${disabled ? 'Coming soon' : 'Tap to start'}`}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.codeBadge, { backgroundColor: colors.accentLight }]}>
                    <Text style={[styles.codeText, { color: colors.accent }]}>{paper.code}</Text>
                </View>
                {bestPassed && (
                    <View style={[styles.passedBadge, { backgroundColor: colors.successLight }]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                        <Text style={[styles.passedText, { color: colors.success }]}>Passed</Text>
                    </View>
                )}
                {paper.is_mandatory && !bestPassed && (
                    <View style={[styles.mandatoryBadge, { backgroundColor: colors.warningLight }]}>
                        <Text style={[styles.mandatoryText, { color: colors.warning }]}>Required</Text>
                    </View>
                )}
            </View>

            {/* Title & Description */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>{paper.title}</Text>
            {paper.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                    {paper.description}
                </Text>
            )}

            {/* Stats Row */}
            <View style={[styles.statsRow, { borderTopColor: colors.borderLight }]}>
                <View style={styles.stat}>
                    <Ionicons name="help-circle-outline" size={16} color={colors.textTertiary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {paper.question_count} questions
                    </Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {paper.duration_minutes} min
                    </Text>
                </View>
                {hasAttempts && (
                    <View style={styles.stat}>
                        <Ionicons name="trophy-outline" size={16} color={colors.textTertiary} />
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                            Best: {stats.bestScore}%
                        </Text>
                    </View>
                )}
                {!hasAttempts && (
                    <View style={styles.stat}>
                        <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.accent} />
                        <Text style={[styles.statText, { color: colors.accent }]}>
                            Start
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    codeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    codeText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    passedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    passedText: {
        fontSize: 12,
        fontWeight: '600',
    },
    mandatoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    mandatoryText: {
        fontSize: 11,
        fontWeight: '600',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 22,
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 0.5,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
