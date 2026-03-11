import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ProgrammeWithModules } from '@/types/roadmap';
import { displayWeight, letterSpacing } from '@/constants/platform';
import { ANIM } from '@/constants/ui';
import type { ThemeColors } from '@/types/theme';

interface Props {
    /**
     * The SeedLYFE programme — used to show seed progress while SproutLYFE is locked.
     * Pass undefined if you only want to show the "unlocked early" state.
     */
    seedProgramme?: ProgrammeWithModules;
    /**
     * If true, SproutLYFE was manually unlocked by management before SeedLYFE was complete.
     * The overlay will not be shown — but if the parent renders it conditionally we show
     * an "Unlocked early" info banner instead.
     */
    manuallyUnlocked?: boolean;
    /** Display name of the reviewer who unlocked early (populated from management data). */
    unlockedByName?: string | null;
    colors: ThemeColors;
}

/**
 * Overlay shown when a candidate taps the SproutLYFE tab while it is still locked.
 * Two states:
 *   - Locked: lock icon + progress towards SeedLYFE completion
 *   - Manually unlocked: info banner "Unlocked early by [name]"
 */
function ProgrammeLockedOverlay({ seedProgramme, manuallyUnlocked, unlockedByName, colors }: Props) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: ANIM.MICRO, easing: Easing.out(Easing.cubic) });
    }, [opacity]);

    const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    if (manuallyUnlocked) {
        return (
            <Animated.View style={[styles.container, fadeStyle]}>
                <View
                    style={[
                        styles.unlockedBanner,
                        { backgroundColor: colors.success + '14', borderColor: colors.success + '30' },
                    ]}
                >
                    <Ionicons name="lock-open-outline" size={18} color={colors.success} />
                    <Text style={[styles.unlockedText, { color: colors.success }]}>
                        {unlockedByName ? `Unlocked early by ${unlockedByName}` : 'Unlocked early by your manager'}
                    </Text>
                </View>
            </Animated.View>
        );
    }

    const seedCompletedCount = seedProgramme?.completedCount ?? 0;
    const seedTotalCount = seedProgramme?.totalCount ?? 0;
    const seedPercentage = seedProgramme?.percentage ?? 0;

    return (
        <Animated.View style={[styles.container, fadeStyle]}>
            <View style={[styles.card, { backgroundColor: colors.surfacePrimary }]}>
                {/* Lock icon */}
                <View style={[styles.iconCircle, { backgroundColor: colors.border }]}>
                    <Ionicons name="lock-closed" size={28} color={colors.textTertiary} />
                </View>

                <Text style={[styles.title, { color: colors.textPrimary }]}>SproutLYFE is Locked</Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Complete SeedLYFE to unlock the advanced programme.
                </Text>

                {/* SeedLYFE progress */}
                <View style={[styles.progressCard, { backgroundColor: colors.background }]}>
                    <View style={styles.progressHeader}>
                        <View style={styles.progressLabel}>
                            <View style={[styles.dot, { backgroundColor: colors.seedLyfe }]} />
                            <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>SeedLYFE Progress</Text>
                        </View>
                        <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                            {seedCompletedCount}/{seedTotalCount}
                        </Text>
                    </View>

                    <View style={[styles.track, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.fill,
                                {
                                    backgroundColor: colors.accent,
                                    width: `${seedPercentage}%`,
                                },
                            ]}
                        />
                    </View>

                    <Text style={[styles.percentage, { color: colors.accent }]}>{seedPercentage}% complete</Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: displayWeight('700'),
        letterSpacing: letterSpacing(-0.3),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    progressCard: {
        width: '100%',
        borderRadius: 12,
        padding: 16,
        gap: 10,
        marginTop: 4,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressCount: {
        fontSize: 13,
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 3,
        minWidth: 4,
    },
    percentage: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Manually unlocked banner
    unlockedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
    },
    unlockedText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});

export default React.memo(ProgrammeLockedOverlay);
