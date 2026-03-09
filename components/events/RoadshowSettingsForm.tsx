import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface RoadshowSettingsFormProps {
    rsWeeklyCost: string;
    onWeeklyCostChange: (v: string) => void;
    rsSlots: number;
    onSlotsChange: React.Dispatch<React.SetStateAction<number>>;
    rsGrace: number;
    onGraceChange: React.Dispatch<React.SetStateAction<number>>;
    rsSitdowns: number;
    onSitdownsChange: React.Dispatch<React.SetStateAction<number>>;
    rsPitches: number;
    onPitchesChange: React.Dispatch<React.SetStateAction<number>>;
    rsClosed: number;
    onClosedChange: React.Dispatch<React.SetStateAction<number>>;
    rsConfigLocked: boolean;
    errors: Record<string, string>;
    onClearError: (key: string) => void;
}

export default function RoadshowSettingsForm({
    rsWeeklyCost,
    onWeeklyCostChange,
    rsSlots,
    onSlotsChange,
    rsGrace,
    onGraceChange,
    rsSitdowns,
    onSitdownsChange,
    rsPitches,
    onPitchesChange,
    rsClosed,
    onClosedChange,
    rsConfigLocked,
    errors,
    onClearError,
}: RoadshowSettingsFormProps) {
    const { colors } = useTheme();
    const labelStyle = [styles.label, { color: colors.textSecondary }];
    const inputStyle = [
        styles.input,
        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary },
    ];

    const targetSetters = { sitdowns: onSitdownsChange, pitches: onPitchesChange, closed: onClosedChange };
    const targetValues = { sitdowns: rsSitdowns, pitches: rsPitches, closed: rsClosed };
    const targetLabels = { sitdowns: 'Sitdowns', pitches: 'Pitches', closed: 'Cases Closed' };

    return (
        <View style={[styles.rsSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.rsSectionTitle, { color: colors.textPrimary }]}>Roadshow Settings</Text>
            {rsConfigLocked && (
                <View style={[styles.rsLockedBanner, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
                    <Text style={[{ color: colors.textTertiary, fontSize: 12, flex: 1 }]}>
                        Config locked — agents have already checked in.
                    </Text>
                </View>
            )}
            <View style={styles.field}>
                <Text style={labelStyle}>Weekly Cost ($) *</Text>
                <TextInput
                    style={[
                        inputStyle,
                        errors.rsWeeklyCost && { borderColor: colors.danger },
                        rsConfigLocked && { opacity: 0.5 },
                    ]}
                    placeholder="e.g. 1800"
                    placeholderTextColor={colors.textTertiary}
                    value={rsWeeklyCost}
                    onChangeText={(v) => {
                        onWeeklyCostChange(v.replace(/[^0-9.]/g, ''));
                        onClearError('rsWeeklyCost');
                    }}
                    keyboardType="decimal-pad"
                    editable={!rsConfigLocked}
                />
                {errors.rsWeeklyCost ? (
                    <Text style={[styles.errorText, { color: colors.danger }]}>{errors.rsWeeklyCost}</Text>
                ) : null}
            </View>

            {/* Agents per slot stepper */}
            <View style={styles.rsStepper}>
                <Text style={labelStyle}>Agents per slot / day</Text>
                <View style={styles.rsStepperRow}>
                    <TouchableOpacity
                        style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                        onPress={() => onSlotsChange((v) => Math.max(1, v - 1))}
                        disabled={rsConfigLocked}
                        accessibilityLabel="Decrease agents per slot"
                    >
                        <Ionicons name="remove" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.rsStepValue, { color: colors.textPrimary }]}>{rsSlots}</Text>
                    <TouchableOpacity
                        style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                        onPress={() => onSlotsChange((v) => v + 1)}
                        disabled={rsConfigLocked}
                        accessibilityLabel="Increase agents per slot"
                    >
                        <Ionicons name="add" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grace period stepper */}
            <View style={styles.rsStepper}>
                <Text style={labelStyle}>Grace period (minutes)</Text>
                <View style={styles.rsStepperRow}>
                    <TouchableOpacity
                        style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                        onPress={() => onGraceChange((v) => Math.max(0, v - 5))}
                        accessibilityLabel="Decrease grace period"
                    >
                        <Ionicons name="remove" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.rsStepValue, { color: colors.textPrimary }]}>{rsGrace}</Text>
                    <TouchableOpacity
                        style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                        onPress={() => onGraceChange((v) => v + 5)}
                        accessibilityLabel="Increase grace period"
                    >
                        <Ionicons name="add" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Suggested daily targets */}
            <Text style={[styles.rsSectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>
                Suggested Daily Targets
            </Text>
            {(['sitdowns', 'pitches', 'closed'] as const).map((key) => (
                <View key={key} style={styles.rsStepper}>
                    <Text style={labelStyle}>{targetLabels[key]}</Text>
                    <View style={styles.rsStepperRow}>
                        <TouchableOpacity
                            style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={() => targetSetters[key]((v) => Math.max(0, v - 1))}
                            accessibilityLabel={`Decrease ${targetLabels[key]} target`}
                        >
                            <Ionicons name="remove" size={18} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.rsStepValue, { color: colors.textPrimary }]}>{targetValues[key]}</Text>
                        <TouchableOpacity
                            style={[styles.rsStepBtn, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={() => targetSetters[key]((v) => v + 1)}
                            accessibilityLabel={`Increase ${targetLabels[key]} target`}
                        >
                            <Ionicons name="add" size={18} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {/* Cost preview */}
            {rsWeeklyCost && !isNaN(Number(rsWeeklyCost)) && Number(rsWeeklyCost) > 0 && (
                <View style={[styles.rsPreview, { backgroundColor: colors.background }]}>
                    <Text style={[styles.rsPreviewTitle, { color: colors.textSecondary }]}>Cost Preview</Text>
                    <View style={styles.rsPreviewRow}>
                        <Text style={[styles.rsPreviewLabel, { color: colors.textTertiary }]}>Daily cost</Text>
                        <Text style={[styles.rsPreviewValue, { color: colors.textPrimary }]}>
                            ${(Number(rsWeeklyCost) / 7).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.rsPreviewRow}>
                        <Text style={[styles.rsPreviewLabel, { color: colors.textTertiary }]}>Per agent / slot</Text>
                        <Text style={[styles.rsPreviewValue, { color: colors.accent, fontWeight: '700' }]}>
                            ${(Number(rsWeeklyCost) / 7 / Math.max(1, rsSlots)).toFixed(2)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: 0 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    errorText: { fontSize: 12, marginTop: 4 },
    rsSection: { borderRadius: 14, padding: 16, gap: 12, marginBottom: 16 },
    rsSectionTitle: { fontSize: 15, fontWeight: '700' },
    rsLockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 10 },
    rsStepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rsStepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rsStepBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rsStepValue: { fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' },
    rsPreview: { borderRadius: 10, padding: 12, gap: 6, marginTop: 4 },
    rsPreviewTitle: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    rsPreviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
    rsPreviewLabel: { fontSize: 13 },
    rsPreviewValue: { fontSize: 13, fontWeight: '600' },
});
