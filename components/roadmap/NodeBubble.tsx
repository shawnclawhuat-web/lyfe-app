import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Touchable from '@/components/Touchable';
import type { NodeState } from '@/types/roadmap';
import { letterSpacing } from '@/constants/platform';
import type { ThemeColors } from '@/types/theme';

const CARET_SIZE = 14;

interface Props {
    title: string;
    state: NodeState;
    onAction: () => void;
    colors: ThemeColors;
    /** The node's main color — used as bubble background for active states */
    nodeColor: string;
    /** Horizontal offset of the caret tip from bubble left edge */
    caretOffset: number;
    /** When true, plays exit animation then calls onDismissComplete */
    closing?: boolean;
    onDismissComplete?: () => void;
}

function NodeBubble({ title, state, onAction, colors, nodeColor, caretOffset, closing, onDismissComplete }: Props) {
    const isLocked = state === 'locked';
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: 1,
            damping: 14,
            stiffness: 350,
            mass: 0.8,
            useNativeDriver: true,
        }).start();
    }, [anim]);

    useEffect(() => {
        if (!closing) return;
        Animated.spring(anim, {
            toValue: 0,
            damping: 14,
            stiffness: 350,
            mass: 0.8,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) onDismissComplete?.();
        });
    }, [closing, anim, onDismissComplete]);

    const bubbleBg = isLocked ? colors.surfacePrimary : nodeColor;
    const titleColor = isLocked ? colors.textSecondary : '#FFFFFF';
    const btnBg = isLocked ? colors.border : '#FFFFFF';
    const btnTextColor = isLocked ? colors.textTertiary : nodeColor;
    const actionLabel = isLocked ? 'LOCKED' : state === 'completed' ? 'REVIEW' : 'START';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: anim,
                    transform: [
                        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-15, 0] }) },
                    ],
                },
            ]}
        >
            {/* Upward caret pointing to node above */}
            <View style={styles.caretRow}>
                <View
                    style={[
                        styles.caret,
                        {
                            borderBottomColor: bubbleBg,
                            marginLeft: caretOffset,
                        },
                    ]}
                />
            </View>

            {/* Card */}
            <View
                style={[
                    styles.card,
                    { backgroundColor: bubbleBg },
                    isLocked && { borderWidth: 2, borderColor: colors.border },
                ]}
            >
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
                    {title}
                </Text>

                {isLocked && (
                    <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
                        Complete earlier modules to unlock
                    </Text>
                )}

                <Touchable
                    style={[styles.actionBtn, { backgroundColor: btnBg }]}
                    onPress={onAction}
                    disabled={isLocked}
                    activeOpacity={0.8}
                    accessibilityLabel={`${actionLabel} ${title}`}
                >
                    <Text style={[styles.actionText, { color: btnTextColor }]}>{actionLabel}</Text>
                </Touchable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        // width controlled by parent
    },
    caretRow: {
        flexDirection: 'row',
    },
    caret: {
        width: 0,
        height: 0,
        borderLeftWidth: CARET_SIZE / 2,
        borderRightWidth: CARET_SIZE / 2,
        borderBottomWidth: CARET_SIZE,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    card: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        marginTop: -1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        letterSpacing: letterSpacing(-0.3),
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
        lineHeight: 18,
    },
    actionBtn: {
        marginTop: 12,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default React.memo(NodeBubble);
