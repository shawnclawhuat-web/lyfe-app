import { useTheme } from '@/contexts/ThemeContext';
import { dateDiffDays, formatDateLabel, isValidDate } from '@/lib/dateTime';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface EventDateSectionProps {
    /** Whether the event is a roadshow type */
    isRoadshow: boolean;
    /** Whether we're editing an existing event */
    isEditing: boolean;
    /** Whether we're editing a roadshow (locks fields) */
    isEditingRoadshow: boolean;
    /** Single event date */
    eventDate: string;
    /** Roadshow start date */
    rsStartDate: string;
    /** Roadshow end date */
    rsEndDate: string;
    /** Validation errors */
    errors: Record<string, string>;
    /** Open the date picker ('single' or 'range') */
    onOpenDatePicker: (mode: 'single' | 'range') => void;
}

export default function EventDateSection({
    isRoadshow,
    isEditing,
    isEditingRoadshow,
    eventDate,
    rsStartDate,
    rsEndDate,
    errors,
    onOpenDatePicker,
}: EventDateSectionProps) {
    const { colors } = useTheme();
    const labelStyle = [styles.label, { color: colors.textSecondary }];

    if (!isRoadshow || isEditing) {
        return (
            <View style={styles.field}>
                <Text style={labelStyle}>Date *</Text>
                <TouchableOpacity
                    style={[
                        styles.datePickerRow,
                        {
                            backgroundColor: colors.inputBackground,
                            borderColor: errors.eventDate ? colors.danger : colors.inputBorder,
                        },
                        isEditingRoadshow && { opacity: 0.5 },
                    ]}
                    onPress={() => !isEditingRoadshow && onOpenDatePicker('single')}
                    activeOpacity={isEditingRoadshow ? 1 : 0.7}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                    <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                        {formatDateLabel(eventDate)}
                    </Text>
                    {!isEditingRoadshow && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
                </TouchableOpacity>
                {isEditingRoadshow && (
                    <Text style={[{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }]}>
                        Date is locked for roadshow events. To add more days, create a new roadshow.
                    </Text>
                )}
                {errors.eventDate ? (
                    <Text style={[styles.errorText, { color: colors.danger }]}>{errors.eventDate}</Text>
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.field}>
            <Text style={labelStyle}>Date Range *</Text>
            <TouchableOpacity
                style={[
                    styles.datePickerRow,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: errors.rsStartDate || errors.rsEndDate ? colors.danger : colors.inputBorder,
                    },
                ]}
                onPress={() => onOpenDatePicker('range')}
                activeOpacity={0.7}
            >
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                    {rsStartDate === rsEndDate
                        ? formatDateLabel(rsStartDate)
                        : `${formatDateLabel(rsStartDate)} – ${formatDateLabel(rsEndDate)}`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            {errors.rsStartDate ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.rsStartDate}</Text>
            ) : null}
            {errors.rsEndDate ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.rsEndDate}</Text>
            ) : null}
            {rsStartDate &&
                rsEndDate &&
                isValidDate(rsStartDate) &&
                isValidDate(rsEndDate) &&
                rsEndDate >= rsStartDate && (
                    <Text style={[styles.rsPreviewHint, { color: colors.textTertiary }]}>
                        Creates {dateDiffDays(rsStartDate, rsEndDate) + 1} daily event
                        {dateDiffDays(rsStartDate, rsEndDate) + 1 > 1 ? 's' : ''} · {formatDateLabel(rsStartDate)} –{' '}
                        {formatDateLabel(rsEndDate)}
                    </Text>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    errorText: { fontSize: 12, marginTop: 4 },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    datePickerText: { flex: 1, fontSize: 16, fontWeight: '500' },
    rsPreviewHint: { fontSize: 12, marginTop: 6 },
});
