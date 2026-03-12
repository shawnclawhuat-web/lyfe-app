import { PA_MANAGER_COLORS } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import type { AssignedManager } from '@/types/recruitment';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/types/theme';

interface AssignedManagersCardProps {
    colors: ThemeColors;
    managers: AssignedManager[];
}

export default function AssignedManagersCard({ colors, managers }: AssignedManagersCardProps) {
    const sortedIds = [...managers].sort((a, b) => a.id.localeCompare(b.id)).map((m) => m.id);

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.textPrimary }]}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ASSIGNED MANAGERS</Text>
            {managers.length === 0 ? (
                <View style={styles.emptyRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No managers assigned yet</Text>
                </View>
            ) : (
                managers.map((mgr, index) => {
                    const color = PA_MANAGER_COLORS[sortedIds.indexOf(mgr.id) % PA_MANAGER_COLORS.length];
                    return (
                        <React.Fragment key={mgr.id}>
                            <View style={styles.row}>
                                <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
                                    <Text style={[styles.avatarText, { color }]}>
                                        {mgr.full_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </Text>
                                </View>
                                <View style={styles.textCol}>
                                    <Text style={[styles.label, { color: colors.textPrimary }]}>{mgr.full_name}</Text>
                                    <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Manager</Text>
                                </View>
                            </View>
                            {index < managers.length - 1 && (
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            )}
                        </React.Fragment>
                    );
                })
            )}
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 13, fontWeight: '700' },
    textCol: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 48,
    },
    emptyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    emptyText: { fontSize: 14 },
});
