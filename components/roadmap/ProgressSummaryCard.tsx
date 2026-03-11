import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Touchable from '@/components/Touchable';
import type { ProgrammeWithModules } from '@/types/roadmap';
import { displayWeight, letterSpacing } from '@/constants/platform';
import type { ThemeColors } from '@/types/theme';

interface Props {
    programmes: ProgrammeWithModules[];
    onViewFull: () => void;
    colors: ThemeColors;
}

/**
 * Compact progress summary for embedding in candidate profile (management view).
 * Shows SeedLYFE and SproutLYFE completion at a glance.
 */
function ProgressSummaryCard({ programmes, onViewFull, colors }: Props) {
    if (programmes.length === 0) return null;

    return (
        <View style={[styles.card, { backgroundColor: colors.surfacePrimary }]}>
            <View style={styles.header}>
                <Ionicons name="leaf-outline" size={18} color={colors.accent} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Development Roadmap</Text>
            </View>

            <View style={styles.programmes}>
                {programmes.map((p) => (
                    <View key={p.id} style={styles.programmeRow}>
                        <View style={styles.programmeInfo}>
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor:
                                            p.icon_type === 'seedling' ? colors.seedLyfe : colors.sproutLyfe,
                                    },
                                ]}
                            />
                            <Text style={[styles.programmeName, { color: colors.textPrimary }]}>{p.title}</Text>
                        </View>
                        <View style={styles.progressInfo}>
                            <View
                                style={[styles.miniTrack, { backgroundColor: colors.border }]}
                                accessibilityRole="progressbar"
                                accessibilityValue={{ min: 0, max: p.totalCount, now: p.completedCount }}
                            >
                                <View
                                    style={[
                                        styles.miniFill,
                                        {
                                            backgroundColor: colors.accent,
                                            width: `${p.percentage}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.percentText, { color: colors.textSecondary }]}>
                                {p.completedCount}/{p.totalCount}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <Touchable onPress={onViewFull} activeOpacity={0.7}>
                <View style={[styles.viewButton, { borderTopColor: colors.border }]}>
                    <Text style={[styles.viewButtonText, { color: colors.accent }]}>View Full Progress</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                </View>
            </Touchable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: displayWeight('600'),
        letterSpacing: letterSpacing(-0.2),
    },
    programmes: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 10,
    },
    programmeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    programmeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    programmeName: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniTrack: {
        width: 80,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    miniFill: {
        height: '100%',
        borderRadius: 3,
        minWidth: 2,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '500',
        width: 32,
        textAlign: 'right',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 4,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: displayWeight('600'),
    },
});

export default React.memo(ProgressSummaryCard);
