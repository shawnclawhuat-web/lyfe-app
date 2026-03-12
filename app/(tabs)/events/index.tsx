import EventCard from '@/components/events/EventCard';
import InlineCalendar from '@/components/events/InlineCalendar';
import LoadingState from '@/components/LoadingState';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAllEvents, fetchEvents } from '@/lib/events';
import { toDateStr } from '@/lib/dateTime';
import type { AgencyEvent } from '@/types/event';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Main Screen ────────────────────────────────────────────────
export default function EventsScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const navigation = useNavigation();

    const scrollToTodayRef = useRef<(() => void) | null>(null);

    // Scroll to today when switching to Events tab
    useFocusEffect(
        useCallback(() => {
            scrollToTodayRef.current?.();
        }, []),
    );

    // Scroll to today when re-tapping the already-active Events tab
    useEffect(() => {
        const parent = navigation.getParent();
        if (!parent) return;
        const unsubscribe = parent.addListener('tabPress' as any, () => {
            scrollToTodayRef.current?.();
        });
        return unsubscribe;
    }, [navigation]);

    const todayStr = toDateStr(new Date());
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [allEvents, setAllEvents] = useState<AgencyEvent[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isPA = user?.role === 'pa' || user?.role === 'admin';
    const canCreateEvents = user?.role && ['admin', 'director', 'manager', 'pa'].includes(user.role);

    const loadEvents = useCallback(async () => {
        if (!user?.id) return;

        const { data, error } = isPA ? await fetchAllEvents() : await fetchEvents(user.id);

        if (!error) setAllEvents(data);
        setIsLoading(false);
    }, [user?.id, isPA]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [loadEvents]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadEvents();
        setRefreshing(false);
    }, [loadEvents]);

    const eventDates = useMemo(() => new Set(allEvents.map((e) => e.event_date)), [allEvents]);

    const dayEvents = useMemo(() => allEvents.filter((e) => e.event_date === selectedDate), [allEvents, selectedDate]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <ScreenHeader title="Events" />
                <LoadingState />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScreenHeader title="Events" />

            <InlineCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                eventDates={eventDates}
                colors={colors}
                scrollToTodayRef={scrollToTodayRef}
            />

            <FlatList
                data={dayEvents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No events</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                            Nothing scheduled for this day
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => router.push(`/(tabs)/events/${item.id}`)} colors={colors} />
                )}
            />

            {canCreateEvents && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.accent }]}
                    onPress={() => router.push('/(tabs)/events/create')}
                    activeOpacity={0.85}
                    accessibilityLabel="Create event"
                >
                    <Ionicons name="add" size={28} color={colors.textInverse} />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, paddingBottom: 100 },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 8,
    },
    emptyTitle: { fontSize: 17, fontWeight: '600' },
    emptySubtitle: { fontSize: 14 },

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 28,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
});
