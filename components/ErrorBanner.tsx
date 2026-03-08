import { ERROR_BG, ERROR_TEXT } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
    style?: StyleProp<ViewStyle>;
}

export default function ErrorBanner({ message, onRetry, style }: ErrorBannerProps) {
    const Wrapper = onRetry ? TouchableOpacity : View;
    return (
        <Wrapper style={[styles.banner, { backgroundColor: ERROR_BG }, style]} {...(onRetry ? { onPress: onRetry, activeOpacity: 0.7 } : {})}>
            <Ionicons name="alert-circle" size={16} color={ERROR_TEXT} />
            <Text style={styles.text}>{message}</Text>
            {onRetry && <Text style={styles.retry}>Tap to retry</Text>}
        </Wrapper>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    text: {
        flex: 1,
        fontSize: 13,
        color: ERROR_TEXT,
    },
    retry: {
        fontSize: 12,
        fontWeight: '600',
        color: ERROR_TEXT,
    },
});
