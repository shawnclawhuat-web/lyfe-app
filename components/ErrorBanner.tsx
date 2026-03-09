import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export default function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.banner}
                onPress={onRetry}
                activeOpacity={onRetry ? 0.7 : 1}
                disabled={!onRetry}
            >
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{message}</Text>
                {onRetry && <Text style={styles.retryText}>Tap to retry</Text>}
                {onDismiss && !onRetry && (
                    <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={16} color="#DC2626" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
            {onDismiss && onRetry && (
                <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={onDismiss}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    banner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    errorText: { flex: 1, fontSize: 13, color: '#DC2626' },
    retryText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
    dismissButton: {
        marginLeft: 8,
    },
});
