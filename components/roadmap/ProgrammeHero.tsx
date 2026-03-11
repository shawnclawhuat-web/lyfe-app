import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import PixelSeedling from './PixelSeedling';
import PixelSprout from './PixelSprout';
import type { ProgrammeIconType } from '@/types/roadmap';
import { letterSpacing, displayWeight } from '@/constants/platform';
import { ANIM } from '@/constants/ui';
import type { ThemeColors } from '@/types/theme';

interface Props {
    iconType: ProgrammeIconType;
    title: string;
    completedCount: number;
    totalCount: number;
    percentage: number;
    colors: ThemeColors;
    reducedMotion?: boolean;
}

function ProgrammeHero({ iconType, title, completedCount, totalCount, percentage, colors, reducedMotion }: Props) {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        if (reducedMotion) {
            progressWidth.value = percentage;
        } else {
            // Delayed entrance animation (200ms pause → 600ms fill)
            progressWidth.value = withDelay(
                200,
                withTiming(percentage, { duration: ANIM.REVEAL, easing: Easing.out(Easing.cubic) }),
            );
        }
    }, [percentage, progressWidth, reducedMotion]);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary }]}>
            <View style={styles.illustrationRow}>
                <View style={styles.illustration}>
                    {iconType === 'seedling' ? (
                        <PixelSeedling size={0.88} reducedMotion={reducedMotion} />
                    ) : (
                        <PixelSprout size={1.0} reducedMotion={reducedMotion} />
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[styles.stats, { color: colors.textSecondary }]}>
                        {completedCount} of {totalCount} modules
                    </Text>
                    <View
                        style={[styles.progressTrack, { backgroundColor: colors.border }]}
                        accessibilityRole="progressbar"
                        accessibilityValue={{ min: 0, max: 100, now: percentage }}
                    >
                        <Animated.View
                            style={[styles.progressFill, { backgroundColor: colors.accent }, progressStyle]}
                        />
                    </View>
                    <Text style={[styles.percentage, { color: colors.accent }]}>{percentage}%</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 16,
        padding: 20,
    },
    illustrationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    illustration: {
        width: 80,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: displayWeight('700'),
        letterSpacing: letterSpacing(-0.4),
        marginBottom: 4,
    },
    stats: {
        fontSize: 14,
        marginBottom: 12,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        minWidth: 4,
    },
    percentage: {
        fontSize: 14,
        fontWeight: displayWeight('600'),
        marginTop: 6,
    },
});

export default React.memo(ProgrammeHero);
