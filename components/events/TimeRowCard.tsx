import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface TimeRowCardProps {
    hasEndTime: boolean;
    formatStart: () => string;
    formatEnd: () => string;
    onStartPress: () => void;
    onEndPress: () => void;
    endTimeError?: string;
}

export default function TimeRowCard({
    hasEndTime,
    formatStart,
    formatEnd,
    onStartPress,
    onEndPress,
    endTimeError,
}: TimeRowCardProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Time *</Text>
            <View
                style={[
                    styles.timeRowCard,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                ]}
            >
                <TouchableOpacity style={styles.timeCell} onPress={onStartPress} activeOpacity={0.7}>
                    <Text style={[styles.timeCellLabel, { color: colors.textTertiary }]}>Start</Text>
                    <Text style={[styles.timeCellValue, { color: colors.textPrimary }]}>{formatStart()}</Text>
                </TouchableOpacity>

                <View style={[styles.timeCellDivider, { backgroundColor: colors.border }]} />

                <TouchableOpacity style={styles.timeCell} onPress={onEndPress} activeOpacity={0.7}>
                    {hasEndTime ? (
                        <>
                            <Text style={[styles.timeCellLabel, { color: colors.textTertiary }]}>End</Text>
                            <Text style={[styles.timeCellValue, { color: colors.textPrimary }]}>{formatEnd()}</Text>
                        </>
                    ) : (
                        <View style={styles.timeCellAdd}>
                            <Ionicons name="add" size={16} color={colors.accent} />
                            <Text style={[styles.timeCellAddText, { color: colors.accent }]}>End time</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            {endTimeError ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{endTimeError}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    errorText: { fontSize: 12, marginTop: 4 },
    timeRowCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    timeCell: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center', minHeight: 60 },
    timeCellLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    timeCellValue: { fontSize: 17, fontWeight: '500' },
    timeCellDivider: { width: StyleSheet.hairlineWidth },
    timeCellAdd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeCellAddText: { fontSize: 15, fontWeight: '500' },
});
