import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Touchable from '@/components/Touchable';
import type { NodeState, ModuleType } from '@/types/roadmap';
import { NODE_STATE_CONFIG } from '@/types/roadmap';
import { ANIM } from '@/constants/ui';
import type { ThemeColors } from '@/types/theme';

export const NODE_SIZE = 64;
export const SHADOW_DEPTH = 5;
const SHINE_OPACITY = 0.18;

/** Darken a #RRGGBB hex color by a factor (0-1) */
function darkenColor(hex: string, amount: number = 0.3): string {
    const h = hex.replace('#', '');
    if (h.length < 6) return hex;
    const r = Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * (1 - amount)));
    const g = Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * (1 - amount)));
    const b = Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface Props {
    title: string;
    state: NodeState;
    moduleType: ModuleType;
    index: number;
    onPress: () => void;
    colors: ThemeColors;
    iconName?: string;
    iconColor?: string;
    reducedMotion?: boolean;
}

function RoadmapNode({ title, state, index, onPress, colors, iconName, iconColor, reducedMotion }: Props) {
    const pulseOpacity = useSharedValue(1);
    const nodeScale = useSharedValue(NODE_STATE_CONFIG[state].scale);

    useEffect(() => {
        if (state === 'current' && !reducedMotion) {
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            );
            nodeScale.value = withSpring(NODE_STATE_CONFIG.current.scale, { damping: 15 });
        } else {
            pulseOpacity.value = withTiming(1, { duration: ANIM.MICRO });
            if (reducedMotion) {
                nodeScale.value = NODE_STATE_CONFIG[state].scale;
            } else {
                nodeScale.value = withSpring(NODE_STATE_CONFIG[state].scale, { damping: 15 });
            }
        }
    }, [state, pulseOpacity, nodeScale, reducedMotion]);

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: nodeScale.value }],
    }));

    const pulseRingStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    const isLocked = state === 'locked';
    const isCompleted = state === 'completed';
    const isCurrent = state === 'current';

    // Duolingo-style candy button colors
    const btnColors = useMemo(() => {
        if (isCompleted) {
            return { main: colors.success, shadow: darkenColor(colors.success) };
        }
        if (isCurrent) {
            return { main: colors.accent, shadow: darkenColor(colors.accent) };
        }
        if (isLocked) {
            return { main: '#4A4A4E', shadow: '#2C2C2E' };
        }
        // available — use the module's icon color
        const base = iconColor ?? '#6E6E73';
        return { main: base, shadow: darkenColor(base) };
    }, [state, colors, iconColor, isCompleted, isCurrent, isLocked]);

    const icon = isCompleted ? 'checkmark' : isLocked ? 'lock-closed' : ((iconName as any) ?? 'book-outline');

    const iconColor_ = isLocked ? '#8E8E93' : '#FFFFFF';

    return (
        <Touchable
            style={styles.wrapper}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityLabel={`Step ${index + 1}: ${title}, ${state}`}
            accessibilityHint={isLocked ? 'Complete earlier modules to unlock' : 'Tap to see details'}
        >
            <Animated.View style={[scaleStyle, { opacity: NODE_STATE_CONFIG[state].opacity }]}>
                {/* Pulse ring for current node */}
                {isCurrent && (
                    <Animated.View style={[styles.pulseRing, { borderColor: colors.accent }, pulseRingStyle]} />
                )}

                {/* 3D candy button: shadow base + main circle + shine */}
                <View style={[styles.shadowBase, { backgroundColor: btnColors.shadow }]}>
                    <View style={[styles.mainCircle, { backgroundColor: btnColors.main }]}>
                        {/* Top highlight shine */}
                        <View style={styles.shine} />
                        <Ionicons name={icon} size={26} color={iconColor_} />
                    </View>
                </View>
            </Animated.View>
        </Touchable>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        width: 80,
    },
    shadowBase: {
        width: NODE_SIZE,
        height: NODE_SIZE + SHADOW_DEPTH,
        borderRadius: NODE_SIZE / 2,
        justifyContent: 'flex-start',
    },
    mainCircle: {
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: NODE_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '42%',
        backgroundColor: `rgba(255, 255, 255, ${SHINE_OPACITY})`,
        borderTopLeftRadius: NODE_SIZE / 2,
        borderTopRightRadius: NODE_SIZE / 2,
    },
    pulseRing: {
        position: 'absolute',
        width: NODE_SIZE + 14,
        height: NODE_SIZE + SHADOW_DEPTH + 14,
        borderRadius: (NODE_SIZE + 14) / 2,
        borderWidth: 2.5,
        top: -7,
        left: -7,
    },
});

export default React.memo(RoadmapNode);
