import type { Interview } from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import InterviewCard from './InterviewCard';

interface InterviewSectionProps {
    interviews: Interview[];
    colors: {
        cardBackground: string;
        cardBorder: string;
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        surfacePrimary?: string;
        background: string;
        border: string;
        accent: string;
    };
}

export default function InterviewSection({ interviews, colors }: InterviewSectionProps) {
    const sortedInterviews = [...interviews].sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
    );

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Interviews</Text>
                <Text style={[styles.countBadge, { color: colors.textTertiary }]}>{sortedInterviews.length}</Text>
            </View>
            {sortedInterviews.length === 0 ? (
                <View style={styles.emptyInterviews}>
                    <Ionicons name="videocam-off-outline" size={32} color={colors.textTertiary} />
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No interviews yet</Text>
                </View>
            ) : (
                sortedInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} colors={colors} />
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 16,
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    countBadge: { fontSize: 13, fontWeight: '600' },
    emptyInterviews: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyText: { fontSize: 14 },
});
