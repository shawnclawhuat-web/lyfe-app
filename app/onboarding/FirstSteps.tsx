import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChecklistItem {
    id: string;
    label: string;
    done: boolean;
}

const INITIAL_ITEMS: ChecklistItem[] = [
    { id: 'profile', label: 'Complete your profile', done: false },
    { id: 'lead', label: 'Add your first lead', done: false },
    { id: 'exam', label: 'Read the exam guide', done: false },
];

export default function FirstStepsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [items, setItems] = useState<ChecklistItem[]>(INITIAL_ITEMS);

    const allDone = items.every((item) => item.done);

    const toggleItem = (id: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
            >
                <Text style={[styles.title, { color: colors.textPrimary }]}>First Steps</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Complete these tasks to get started
                </Text>

                <View style={styles.checklist}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.checkRow, { backgroundColor: colors.surfacePrimary }]}
                            onPress={() => toggleItem(item.id)}
                            testID={`checklist-${item.id}`}
                        >
                            <Ionicons
                                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                                size={28}
                                color={item.done ? colors.success : colors.textTertiary}
                            />
                            <Text
                                style={[
                                    styles.checkLabel,
                                    { color: item.done ? colors.textTertiary : colors.textPrimary },
                                    item.done && styles.checkLabelDone,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {allDone && (
                    <View style={[styles.successBanner, { backgroundColor: colors.successLight }]}>
                        <Ionicons name="checkmark-done" size={20} color={colors.success} />
                        <Text style={[styles.successText, { color: colors.success }]}>
                            All tasks completed!
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: allDone ? colors.accent : colors.textTertiary },
                    ]}
                    onPress={() => router.push('/onboarding/OnboardingComplete')}
                    disabled={!allDone}
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
    checklist: {
        gap: 12,
        marginBottom: 24,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 14,
    },
    checkLabel: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    checkLabelDone: {
        textDecorationLine: 'line-through',
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        gap: 10,
    },
    successText: {
        fontSize: 14,
        fontWeight: '600',
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
