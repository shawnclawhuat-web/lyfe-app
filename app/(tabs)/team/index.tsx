import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function TeamScreen() {
    const { colors } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Team</Text>
            </View>
            <View style={styles.placeholder}>
                <Ionicons name="briefcase-outline" size={64} color={colors.textTertiary} />
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Team dashboard coming in Phase 3
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    placeholderText: { fontSize: 15 },
});
