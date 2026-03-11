import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '@/types/theme';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

interface AppearanceCardProps {
    colors: ThemeColors;
    mode: ThemeMode;
    onModeChange: (mode: ThemeMode) => void;
}

export default function AppearanceCard({ colors, mode, onModeChange }: AppearanceCardProps) {
    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>APPEARANCE</Text>
            <View style={styles.themeRow}>
                {THEME_OPTIONS.map((option) => {
                    const isActive = mode === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.themeOption,
                                {
                                    backgroundColor: isActive ? colors.accentLight : colors.inputBackground,
                                    borderColor: isActive ? colors.accent : colors.border,
                                },
                            ]}
                            onPress={() => onModeChange(option.value)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Set theme to ${option.label}`}
                            accessibilityState={{ selected: isActive }}
                        >
                            <Ionicons
                                name={option.icon}
                                size={20}
                                color={isActive ? colors.accent : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.themeLabel,
                                    {
                                        color: isActive ? colors.accent : colors.textSecondary,
                                        fontWeight: isActive ? '600' : '400',
                                    },
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    themeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    themeLabel: {
        fontSize: 13,
    },
});
