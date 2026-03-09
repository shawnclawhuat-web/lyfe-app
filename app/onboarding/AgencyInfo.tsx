import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    colors: ReturnType<typeof useTheme>['colors'];
}

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
    return (
        <View style={[styles.infoRow, { backgroundColor: colors.surfacePrimary }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
            </View>
        </View>
    );
}

export default function AgencyInfoScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const managerName = 'Your Assigned Manager';
    const teamName = 'Lyfe Agency Team';
    const licenceInfo = 'Income Insurance Ltd';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.title, { color: colors.textPrimary }]}>Your Agency</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Here is your agency information
                </Text>

                <View style={styles.infoList}>
                    <InfoRow
                        icon="person-outline"
                        label="Assigned Manager"
                        value={managerName}
                        colors={colors}
                    />
                    <InfoRow
                        icon="people-outline"
                        label="Team"
                        value={teamName}
                        colors={colors}
                    />
                    <InfoRow
                        icon="document-text-outline"
                        label="Licence"
                        value={licenceInfo}
                        colors={colors}
                    />
                    <InfoRow
                        icon="briefcase-outline"
                        label="Role"
                        value={user?.role ?? 'agent'}
                        colors={colors}
                    />
                </View>

                <View style={[styles.noteCard, { backgroundColor: colors.infoLight }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                    <Text style={[styles.noteText, { color: colors.info }]}>
                        This information is managed by your agency. Contact your manager if anything
                        looks incorrect.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.accent }]}
                    onPress={() => router.push('/onboarding/FirstSteps')}
                    testID="continue-button"
                >
                    <Text style={[styles.buttonText, { color: colors.textInverse }]}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
    },
    infoList: {
        gap: 12,
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 14,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    noteCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 10,
        gap: 10,
        alignItems: 'flex-start',
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 12,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
    },
});
