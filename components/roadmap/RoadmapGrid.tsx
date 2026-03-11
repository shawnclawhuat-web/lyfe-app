import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import ModuleGridCard from './ModuleGridCard';
import type { RoadmapModuleWithProgress, NodeState } from '@/types/roadmap';
import type { ThemeColors } from '@/types/theme';

const CARD_GAP = 12;
const HORIZONTAL_PAD = 16;

interface Props {
    modules: RoadmapModuleWithProgress[];
    nodeStates: Map<string, NodeState>;
    onModulePress: (moduleId: string) => void;
    colors: ThemeColors;
    reducedMotion: boolean | null;
    ListHeaderComponent?: React.ReactElement;
    contentContainerStyle?: object;
    refreshing?: boolean;
    onRefresh?: () => void;
    scrollToCurrentOnMount?: boolean;
    /** When true, suppresses the empty state (e.g. locked programmes show the overlay instead). */
    hideEmptyState?: boolean;
}

function RoadmapGrid({
    modules,
    nodeStates,
    onModulePress,
    colors,
    reducedMotion,
    ListHeaderComponent,
    contentContainerStyle,
    refreshing,
    onRefresh,
    scrollToCurrentOnMount,
    hideEmptyState,
}: Props) {
    const flatListRef = useRef<FlatList<RoadmapModuleWithProgress>>(null);
    const hasScrolledRef = useRef(false);
    const hasAnimatedRef = useRef(false);

    // Auto-scroll to first "current" module on initial mount
    useEffect(() => {
        if (!scrollToCurrentOnMount || hasScrolledRef.current || modules.length === 0) return;

        const currentIndex = modules.findIndex((m) => nodeStates.get(m.id) === 'current');
        if (currentIndex < 0) return;

        hasScrolledRef.current = true;

        // FlatList with numColumns groups items into rows — scrollToIndex uses row index
        const rowIndex = Math.floor(currentIndex / 2);

        // Delay to let the FlatList measure its content
        const timer = setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: rowIndex, animated: true, viewPosition: 0.3 });
        }, 400);

        return () => clearTimeout(timer);
    }, [modules, nodeStates, scrollToCurrentOnMount]);

    const handleScrollToIndexFailed = useCallback(
        (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
            // Scroll to the last measured item first, then retry after layout
            flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
            }, 200);
        },
        [],
    );

    // Only stagger FadeInUp on initial mount — tab switches swap data instantly
    const shouldAnimate = !hasAnimatedRef.current && !reducedMotion;
    if (modules.length > 0) hasAnimatedRef.current = true;

    const renderItem = useCallback(
        ({ item, index }: { item: RoadmapModuleWithProgress; index: number }) => {
            const state = nodeStates.get(item.id) ?? 'available';

            if (!shouldAnimate) {
                return <ModuleGridCard module={item} state={state} colors={colors} onPress={onModulePress} />;
            }

            const delay = Math.min(index * 60, 600);
            return (
                <Animated.View entering={FadeInUp.delay(delay).duration(300).springify()}>
                    <ModuleGridCard module={item} state={state} colors={colors} onPress={onModulePress} />
                </Animated.View>
            );
        },
        [nodeStates, onModulePress, colors, shouldAnimate],
    );

    const keyExtractor = useCallback((item: RoadmapModuleWithProgress) => item.id, []);

    return (
        <FlatList
            ref={flatListRef}
            data={modules}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.container, contentContainerStyle]}
            ListHeaderComponent={ListHeaderComponent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.accent} />
                ) : undefined
            }
            onScrollToIndexFailed={handleScrollToIndexFailed}
            ListEmptyComponent={
                hideEmptyState ? null : (
                    <View style={styles.empty}>
                        <Ionicons name="grid-outline" size={36} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No modules available yet
                        </Text>
                    </View>
                )
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: HORIZONTAL_PAD,
    },
    row: {
        gap: CARD_GAP,
        marginBottom: CARD_GAP,
    },
    empty: {
        paddingTop: 40,
        gap: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '500',
    },
});

export default React.memo(RoadmapGrid);
