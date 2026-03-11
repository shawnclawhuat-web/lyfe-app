import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmap } from '@/hooks/useRoadmap';
import ScreenHeader from '@/components/ScreenHeader';
import ProgrammeHero from '@/components/roadmap/ProgrammeHero';
import ProgrammeTabs from '@/components/roadmap/ProgrammeTabs';
import RoadmapPath from '@/components/roadmap/RoadmapPath';
import ProgrammeLockedOverlay from '@/components/roadmap/ProgrammeLockedOverlay';
import ErrorBanner from '@/components/ErrorBanner';
import { displayWeight, TAB_BAR_HEIGHT } from '@/constants/platform';

export default function RoadmapScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();

    // Scroll tracking for auto-scroll to bubble
    const scrollRef = useRef<ScrollView>(null);
    const scrollY = useRef(0);
    const viewportH = useRef(0);
    const pathOffsetY = useRef(0);

    // For candidates, use their own user ID as the candidate ID
    // In production, map user.id → candidate record
    const candidateId = user?.id;

    const { programmes, nodeStates, isLoading, error, refresh, activeProgrammeIndex, setActiveProgrammeIndex } =
        useRoadmap(candidateId);

    const activeProgramme = programmes[activeProgrammeIndex];
    const seedProgramme = programmes.find((p) => p.slug === 'seedlyfe');

    const handleNodePress = useCallback(
        (moduleId: string) => {
            router.push(`/(tabs)/roadmap/module/${moduleId}`);
        },
        [router],
    );

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.current = e.nativeEvent.contentOffset.y;
    }, []);

    const handleViewportLayout = useCallback((e: LayoutChangeEvent) => {
        viewportH.current = e.nativeEvent.layout.height;
    }, []);

    const handlePathLayout = useCallback((e: LayoutChangeEvent) => {
        pathOffsetY.current = e.nativeEvent.layout.y;
    }, []);

    const handleScrollToNode = useCallback((nodeTop: number, bubbleBottom: number) => {
        if (!viewportH.current) return;
        const absoluteBubbleBottom = pathOffsetY.current + bubbleBottom;
        const visibleBottom = scrollY.current + viewportH.current;
        const margin = 24;
        if (absoluteBubbleBottom + margin > visibleBottom) {
            scrollRef.current?.scrollTo({
                y: absoluteBubbleBottom + margin - viewportH.current,
                animated: true,
            });
        }
        // Also scroll up if the node itself is above the viewport
        const absoluteNodeTop = pathOffsetY.current + nodeTop;
        if (absoluteNodeTop < scrollY.current + margin) {
            scrollRef.current?.scrollTo({ y: Math.max(0, absoluteNodeTop - margin), animated: true });
        }
    }, []);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScreenHeader title="My Roadmap" />

            {error && <ErrorBanner message={error} onRetry={refresh} />}

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading your roadmap...</Text>
                </View>
            ) : programmes.length === 0 ? (
                <View style={styles.empty}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surfacePrimary }]}>
                        <Ionicons name="leaf-outline" size={48} color={colors.textTertiary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No roadmap assigned yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Contact your manager to get started.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + bottom + 16 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={handleViewportLayout}
                >
                    {activeProgramme && (
                        <ProgrammeHero
                            iconType={activeProgramme.icon_type}
                            title={activeProgramme.title}
                            completedCount={activeProgramme.completedCount}
                            totalCount={activeProgramme.totalCount}
                            percentage={activeProgramme.percentage}
                            colors={colors}
                            reducedMotion={reducedMotion}
                        />
                    )}

                    <ProgrammeTabs
                        programmes={programmes}
                        activeIndex={activeProgrammeIndex}
                        onSelect={setActiveProgrammeIndex}
                        colors={colors}
                    />

                    {activeProgramme && activeProgramme.isLocked ? (
                        <ProgrammeLockedOverlay
                            seedProgramme={seedProgramme}
                            manuallyUnlocked={activeProgramme.manuallyUnlocked}
                            unlockedByName={activeProgramme.unlockedByName}
                            colors={colors}
                        />
                    ) : activeProgramme ? (
                        <View style={styles.pathContainer} onLayout={handlePathLayout}>
                            <RoadmapPath
                                key={activeProgramme.id}
                                modules={activeProgramme.modules.filter((m) => m.is_active && !m.isArchived)}
                                nodeStates={nodeStates}
                                onNodePress={handleNodePress}
                                colors={colors}
                                reducedMotion={reducedMotion}
                                onScrollToNode={handleScrollToNode}
                            />
                        </View>
                    ) : null}
                </ScrollView>
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
    pathContainer: {
        marginTop: 16,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: displayWeight('600'),
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
