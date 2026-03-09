import Avatar from '@/components/Avatar';
import { ATTENDEE_ROLES, getAvatarColor } from '@/constants/ui';
import { useTheme } from '@/contexts/ThemeContext';
import type { SelectedAttendee } from '@/hooks/useAttendeePicker';
import type { AttendeeRole, ExternalAttendee } from '@/types/event';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AttendeeListProps {
    selectedAttendees: SelectedAttendee[];
    externalAttendees: (ExternalAttendee & { _key: string })[];
    onOpenPicker: () => void;
    onUpdateRole: (userId: string, role: AttendeeRole) => void;
    onRemoveAttendee: (userId: string) => void;
    onUpdateExternalRole: (key: string, role: AttendeeRole) => void;
    onRemoveExternal: (key: string) => void;
}

export default function AttendeeList({
    selectedAttendees,
    externalAttendees,
    onOpenPicker,
    onUpdateRole,
    onRemoveAttendee,
    onUpdateExternalRole,
    onRemoveExternal,
}: AttendeeListProps) {
    const { colors } = useTheme();
    const labelStyle = [styles.label, { color: colors.textSecondary }];

    return (
        <View style={styles.field}>
            <View style={styles.sectionHeader}>
                <Text style={labelStyle}>Attendees ({selectedAttendees.length + externalAttendees.length})</Text>
                <TouchableOpacity
                    onPress={onOpenPicker}
                    style={[styles.addAttendeeBtn, { borderColor: colors.accent }]}
                >
                    <Ionicons name="person-add-outline" size={14} color={colors.accent} />
                    <Text style={[styles.addAttendeeBtnText, { color: colors.accent }]}>Add</Text>
                </TouchableOpacity>
            </View>

            {selectedAttendees.length === 0 && externalAttendees.length === 0 ? (
                <View style={[styles.emptyAttendees, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.emptyAttendeesText, { color: colors.textTertiary }]}>
                        No attendees selected
                    </Text>
                </View>
            ) : (
                <>
                    {selectedAttendees.map((a) => {
                        const aColor = getAvatarColor(a.full_name);
                        return (
                            <View
                                key={a.user_id}
                                style={[styles.attendeeItem, { backgroundColor: colors.cardBackground }]}
                            >
                                <Avatar
                                    name={a.full_name}
                                    avatarUrl={a.avatar_url}
                                    size={36}
                                    backgroundColor={aColor + '18'}
                                    textColor={aColor}
                                />
                                <View style={styles.attendeeItemInfo}>
                                    <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                        {a.full_name}
                                    </Text>
                                    <View style={styles.roleRow}>
                                        {ATTENDEE_ROLES.map((r) => {
                                            const active = a.attendee_role === r.key;
                                            return (
                                                <TouchableOpacity
                                                    key={r.key}
                                                    style={[
                                                        styles.roleChip,
                                                        {
                                                            backgroundColor: active
                                                                ? colors.accent
                                                                : colors.surfaceSecondary,
                                                        },
                                                    ]}
                                                    onPress={() => onUpdateRole(a.user_id, r.key)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.roleChipText,
                                                            {
                                                                color: active ? '#FFFFFF' : colors.textTertiary,
                                                            },
                                                        ]}
                                                    >
                                                        {r.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => onRemoveAttendee(a.user_id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    {externalAttendees.map((a) => {
                        const aColor = getAvatarColor(a.name);
                        return (
                            <View
                                key={a._key}
                                style={[styles.attendeeItem, { backgroundColor: colors.cardBackground }]}
                            >
                                <Avatar
                                    name={a.name}
                                    avatarUrl={null}
                                    size={36}
                                    backgroundColor={aColor + '18'}
                                    textColor={aColor}
                                />
                                <View style={styles.attendeeItemInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                            {a.name}
                                        </Text>
                                        <View
                                            style={[styles.guestBadge, { backgroundColor: colors.surfaceSecondary }]}
                                        >
                                            <Text style={[styles.guestBadgeText, { color: colors.textTertiary }]}>
                                                Guest
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.roleRow}>
                                        {ATTENDEE_ROLES.map((r) => {
                                            const active = a.attendee_role === r.key;
                                            return (
                                                <TouchableOpacity
                                                    key={r.key}
                                                    style={[
                                                        styles.roleChip,
                                                        {
                                                            backgroundColor: active
                                                                ? colors.accent
                                                                : colors.surfaceSecondary,
                                                        },
                                                    ]}
                                                    onPress={() => onUpdateExternalRole(a._key, r.key)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.roleChipText,
                                                            {
                                                                color: active ? '#FFFFFF' : colors.textTertiary,
                                                            },
                                                        ]}
                                                    >
                                                        {r.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => onRemoveExternal(a._key)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    addAttendeeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1.5,
        borderRadius: 8,
    },
    addAttendeeBtnText: { fontSize: 13, fontWeight: '600' },
    emptyAttendees: { borderRadius: 12, padding: 20, alignItems: 'center' },
    emptyAttendeesText: { fontSize: 14 },
    attendeeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    attendeeItemInfo: { flex: 1, gap: 6 },
    attendeeName: { fontSize: 15, fontWeight: '600' },
    roleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    roleChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleChipText: { fontSize: 11, fontWeight: '600' },
    guestBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    guestBadgeText: { fontSize: 10, fontWeight: '700' },
});
