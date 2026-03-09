import type { Interview } from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface InterviewCardProps {
    interview: Interview;
    colors: {
        surfacePrimary?: string;
        background: string;
        border: string;
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        accent: string;
    };
}

export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function InterviewCard({ interview, colors }: InterviewCardProps) {
    const isUpcoming = new Date(interview.datetime) > new Date();
    const statusColor =
        interview.status === 'completed' ? '#34C759' : interview.status === 'cancelled' ? '#FF3B30' : '#FF9500';

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: colors.surfacePrimary || colors.background, borderColor: colors.border },
            ]}
        >
            <View style={styles.headerRow}>
                <View style={styles.roundBadge}>
                    <Text style={styles.roundText}>R{interview.round_number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                        {formatDateTime(interview.datetime)}
                    </Text>
                    <Text style={[styles.typeText, { color: colors.textTertiary }]}>
                        {interview.type === 'zoom' ? 'Zoom' : 'In-Person'}
                    </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </Text>
                </View>
            </View>

            {interview.location && (
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{interview.location}</Text>
                </View>
            )}
            {interview.zoom_link && isUpcoming && (
                <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(interview.zoom_link!)}>
                    <Ionicons name="videocam-outline" size={14} color={colors.accent} />
                    <Text style={[styles.detailText, { color: colors.accent }]}>Join Zoom Meeting</Text>
                </TouchableOpacity>
            )}
            {interview.notes && (
                <View style={styles.detailRow}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{interview.notes}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        borderWidth: 0.5,
        padding: 12,
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    roundBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#007AFF18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundText: { fontSize: 11, fontWeight: '700', color: '#007AFF' },
    dateText: { fontSize: 14, fontWeight: '600' },
    typeText: { fontSize: 12, marginTop: 1 },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: { fontSize: 11, fontWeight: '600' },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    detailText: { fontSize: 13 },
});
