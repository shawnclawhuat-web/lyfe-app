import { Ionicons } from '@expo/vector-icons';
import type { ViewMode } from '@/contexts/ViewModeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ThemeColors } from '@/types/theme';

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'agent', label: 'Agent View', icon: 'person-outline' },
    { value: 'manager', label: 'Manager View', icon: 'shield-outline' },
];

interface ViewModeCardProps {
    colors: ThemeColors;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeCard({ colors, viewMode, onViewModeChange }: ViewModeCardProps) {
    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>VIEW MODE</Text>
            <View style={[styles.segmentContainer, { backgroundColor: colors.inputBackground }]}>
                {VIEW_MODE_OPTIONS.map((option) => {
                    const isActive = viewMode === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.segmentOption,
                                isActive && {
                                    backgroundColor: colors.cardBackground,
                                    shadowColor: colors.textPrimary,
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2,
                                },
                            ]}
                            onPress={() => onViewModeChange(option.value)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Switch to ${option.label}`}
                            accessibilityState={{ selected: isActive }}
                        >
                            <Ionicons
                                name={option.icon}
                                size={18}
                                color={isActive ? colors.accent : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.segmentLabel,
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
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
                {viewMode === 'agent' ? 'Manage your leads and clients' : 'Manage your team and candidates'}
            </Text>
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
    segmentContainer: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 3,
        gap: 2,
    },
    segmentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    segmentLabel: {
        fontSize: 13,
    },
    hint: {
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },
});
