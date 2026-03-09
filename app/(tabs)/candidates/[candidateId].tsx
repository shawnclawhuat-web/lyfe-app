import InterviewSection from '@/components/candidates/InterviewSection';
import ProfileCard from '@/components/candidates/ProfileCard';
import QuickAction from '@/components/candidates/QuickAction';
import StatusStepper from '@/components/candidates/StatusStepper';
import LoadingState from '@/components/LoadingState';
import ScreenHeader from '@/components/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchCandidate } from '@/lib/recruitment';
import type { RecruitmentCandidate } from '@/types/recruitment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOCK_OTP = process.env.EXPO_PUBLIC_MOCK_OTP === 'true';

// ── Main Screen ──

export default function CandidateDetailScreen() {
    const { candidateId } = useLocalSearchParams<{ candidateId: string }>();
    const { colors } = useTheme();
    const router = useRouter();

    const [candidate, setCandidate] = useState<RecruitmentCandidate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCandidate = useCallback(async () => {
        if (MOCK_OTP) {
            // Import mock data from the candidates list screen
            const { MOCK_CANDIDATES } = require('./index');
            const found = MOCK_CANDIDATES.find((c: RecruitmentCandidate) => c.id === candidateId);
            setCandidate(found || null);
            setIsLoading(false);
            return;
        }

        if (!candidateId) return;
        setError(null);
        const { data, error: fetchError } = await fetchCandidate(candidateId);
        if (fetchError) {
            setError(fetchError);
        } else {
            setCandidate(data);
        }
        setIsLoading(false);
    }, [candidateId]);

    useEffect(() => {
        loadCandidate();
    }, [loadCandidate]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader showBack backLabel="Candidates" title="Loading..." />
                <LoadingState />
            </SafeAreaView>
        );
    }

    if (!candidate) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader showBack backLabel="Candidates" title="Not Found" />
                <View style={styles.notFound}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
                        {error || 'Candidate not found'}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.accent, fontWeight: '600' }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader showBack backLabel="Candidates" title={candidate.name} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <ProfileCard candidate={candidate} colors={colors} />

                {/* Quick Actions */}
                <View
                    style={[
                        styles.actionsCard,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <QuickAction
                        icon="call"
                        label="Call"
                        color="#16A34A"
                        bgColor="#DCFCE7"
                        onPress={() => Linking.openURL(`tel:${candidate.phone.replace(/\s/g, '')}`)}
                    />
                    <QuickAction
                        icon="logo-whatsapp"
                        label="WhatsApp"
                        color="#25D366"
                        bgColor="#D1FAE5"
                        onPress={() => {
                            const phone = candidate.phone.replace(/[\s+]/g, '');
                            Linking.openURL(`https://wa.me/${phone}`);
                        }}
                    />
                    <QuickAction
                        icon="calendar"
                        label="Schedule"
                        color="#FF9500"
                        bgColor="#FFF3E0"
                        onPress={() => {}}
                    />
                    <QuickAction
                        icon="create-outline"
                        label="Note"
                        color="#6B7280"
                        bgColor={colors.surfacePrimary || colors.background}
                        onPress={() => {}}
                    />
                </View>

                {/* Pipeline Progress */}
                <View
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    ]}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pipeline Progress</Text>
                    <StatusStepper currentStatus={candidate.status} colors={colors} />
                </View>

                {/* Notes */}
                {candidate.notes && (
                    <View
                        style={[
                            styles.card,
                            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
                        <Text style={[styles.notesBody, { color: colors.textSecondary }]}>{candidate.notes}</Text>
                    </View>
                )}

                {/* Interviews */}
                <InterviewSection interviews={candidate.interviews} colors={colors} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ──

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 16,
        marginBottom: 12,
    },
    actionsCard: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 0.5,
        padding: 12,
        marginBottom: 12,
        justifyContent: 'space-around',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    notesBody: { fontSize: 14, lineHeight: 20 },
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    notFoundText: { fontSize: 16, fontWeight: '600' },
});
