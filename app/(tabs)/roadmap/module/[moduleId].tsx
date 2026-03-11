import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ScreenHeader from '@/components/ScreenHeader';
import ModuleCard from '@/components/roadmap/ModuleCard';
import ErrorBanner from '@/components/ErrorBanner';
import { fetchModule, fetchModuleResources, fetchModuleProgressForCandidate } from '@/lib/roadmap';
import { TAB_BAR_HEIGHT } from '@/constants/platform';
import type { RoadmapModule, RoadmapResource, CandidateModuleProgress } from '@/types/roadmap';

/**
 * Candidate-facing module detail screen.
 * Entirely read-only — no completion actions.
 * Completion is managed by PA/Manager/Director from management views.
 */
export default function ModuleDetailScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();

    const [module, setModule] = useState<RoadmapModule | null>(null);
    const [progress, setProgress] = useState<CandidateModuleProgress | null>(null);
    const [resources, setResources] = useState<RoadmapResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!moduleId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        const [moduleRes, resourcesRes, progressRes] = await Promise.all([
            fetchModule(moduleId),
            fetchModuleResources(moduleId),
            user?.id
                ? fetchModuleProgressForCandidate(user.id, moduleId)
                : Promise.resolve({ data: null, error: null }),
        ]);

        if (moduleRes.error) {
            setError(moduleRes.error);
            setIsLoading(false);
            return;
        }

        if (!moduleRes.data) {
            // Module doesn't exist or is not accessible (disabled/archived)
            setError('This module is not available.');
            setIsLoading(false);
            return;
        }

        setModule(moduleRes.data);
        setResources(resourcesRes.data ?? []);
        setProgress(progressRes.data ?? null);
        setIsLoading(false);
    }, [moduleId, user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleTakeExam = useCallback(() => {
        if (module?.exam_paper_id) {
            router.push(`/(tabs)/exams/take/${module.exam_paper_id}`);
        }
    }, [module, router]);

    // Build the enriched module object that ModuleCard expects
    const enrichedModule = module
        ? {
              ...module,
              progress,
              resources,
              isLocked: false,
              examPaper: null, // exam paper info not loaded here; CTA still works via exam_paper_id
              prerequisiteIds: [],
              isArchived: module.archived_at !== null,
          }
        : null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScreenHeader title="Module" showBack />

            {error && <ErrorBanner message={error} onRetry={loadData} />}

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading module...</Text>
                </View>
            ) : enrichedModule ? (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + bottom + 16 }}
                >
                    <ModuleCard
                        module={enrichedModule}
                        colors={colors}
                        onTakeExam={module?.module_type === 'exam' && module.exam_paper_id ? handleTakeExam : undefined}
                    />
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Module not found</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        This module may have been removed or archived.
                    </Text>
                    <Pressable
                        style={[styles.backButton, { backgroundColor: colors.accent }]}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.backButtonText, { color: colors.textInverse }]}>Go Back</Text>
                    </Pressable>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    backButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
