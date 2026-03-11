import type { ThemeColors } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type QuickActionBtnProps = {
    icon: string;
    label: string;
    colors: ThemeColors;
    onPress: () => void;
};

const QuickActionBtn = memo(function QuickActionBtn({ icon, label, colors, onPress }: QuickActionBtnProps) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const onPressIn = () => {
        scale.value = withSpring(0.97, { damping: 15 });
    };
    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 15 });
    };

    return (
        <TouchableOpacity
            style={[
                styles.quickActionSurface,
                { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary },
            ]}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Animated.View style={[styles.quickActionInner, animatedStyle]}>
                <View style={[styles.quickActionIconWrapper, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name={icon as any} size={22} color={colors.accent} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

export default QuickActionBtn;

const styles = StyleSheet.create({
    quickActionSurface: {
        flex: 1,
        minWidth: '45%',
        borderRadius: 16,
        alignItems: 'center',
        paddingVertical: 14,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    quickActionIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionInner: {
        alignItems: 'center',
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
});
