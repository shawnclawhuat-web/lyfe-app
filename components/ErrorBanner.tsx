import { ERROR_BG, ERROR_TEXT } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ErrorBannerProps {
    message: string;
    style?: StyleProp<ViewStyle>;
}

export default function ErrorBanner({ message, style }: ErrorBannerProps) {
    return (
        <View style={[styles.banner, { backgroundColor: ERROR_BG }, style]}>
            <Ionicons name="alert-circle" size={16} color={ERROR_TEXT} />
            <Text style={styles.text}>{message}</Text>
        </View>
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
});
