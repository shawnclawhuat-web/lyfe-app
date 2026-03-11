import { letterSpacing } from '@/constants/platform';
import { toDateStr } from '@/lib/dateTime';
import type { ThemeColors } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ── Calendar layout constants ──────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const CELL_W = Math.floor(SCREEN_W / 7);
const WEEKS_BUFFER = 26; // ~6 months each direction

const CAL_HEADER_H = 40;
const STRIP_H = 68; // week strip cell height
const GRID_LABELS_H = 24; // Mon–Sun initials
const GRID_ROW_H = 44; // each month-grid row
const CAL_HANDLE_H = 20;
const CAL_WEEK_H = CAL_HEADER_H + STRIP_H + CAL_HANDLE_H;
const CAL_MONTH_H = CAL_HEADER_H + GRID_LABELS_H + GRID_ROW_H * 6 + CAL_HANDLE_H;

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };
const DOW_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Build Mon-aligned day strip centered on today */
function buildStrip(todayStr: string): { dates: string[]; todayWeekIdx: number } {
    const d = new Date(todayStr + 'T00:00:00');
    const dow = (d.getDay() + 6) % 7; // Mon=0
    const start = new Date(d);
    start.setDate(d.getDate() - dow - WEEKS_BUFFER * 7);

    const totalDays = (WEEKS_BUFFER * 2 + 1) * 7;
    const dates: string[] = [];
    const cur = new Date(start);
    for (let i = 0; i < totalDays; i++) {
        dates.push(toDateStr(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return { dates, todayWeekIdx: WEEKS_BUFFER };
}

/** Build a 6-row (42 cell) Mon-first calendar grid for a given month */
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    while (cells.length < 42) cells.push(null);

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

// ── InlineCalendar ─────────────────────────────────────────────
export interface InlineCalendarProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
    eventDates: Set<string>;
    colors: ThemeColors;
    scrollToTodayRef?: React.MutableRefObject<(() => void) | null>;
}

export default function InlineCalendar({
    selectedDate,
    onSelectDate,
    eventDates,
    colors,
    scrollToTodayRef,
}: InlineCalendarProps) {
    const today = toDateStr(new Date());

    // ── Strip data (Mon-aligned, ~6 months each side) ──
    const { dates: stripDates, todayWeekIdx } = useMemo(() => buildStrip(today), [today]);
    const stripRef = useRef<FlatList>(null);
    const todayStripIdx = useMemo(() => {
        const dow = (new Date(today + 'T00:00:00').getDay() + 6) % 7;
        return todayWeekIdx * 7 + dow;
    }, [todayWeekIdx, today]);
    const initialIdx = Math.max(0, todayStripIdx - 3);

    // ── Visible month label (derived from strip scroll) ──
    const [weekMonthLabel, setWeekMonthLabel] = useState(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        return d.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
    });
    const todayIdx = useMemo(() => stripDates.indexOf(today), [stripDates, today]);
    const [todayVisible, setTodayVisible] = useState(true);

    // ── Expand / collapse (week <-> month) ──
    const expandAnim = useRef(new Animated.Value(0)).current;
    const isExpandedRef = useRef(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // ── Month grid state ──
    const [displayMonth, setDisplayMonth] = useState(() => {
        const d = new Date(selectedDate + 'T00:00:00');
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    const monthGrid = useMemo(() => buildMonthGrid(displayMonth.year, displayMonth.month), [displayMonth]);

    // ── Animated values ──
    const calHeight = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [CAL_WEEK_H, CAL_MONTH_H],
        extrapolate: 'clamp',
    });

    const stripOpacity = expandAnim.interpolate({
        inputRange: [0, 0.3],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const gridOpacity = expandAnim.interpolate({
        inputRange: [0.7, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const weekLabelOpacity = expandAnim.interpolate({
        inputRange: [0, 0.3],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const monthLabelOpacity = expandAnim.interpolate({
        inputRange: [0.7, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const contentH = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [STRIP_H, GRID_LABELS_H + GRID_ROW_H * 6],
        extrapolate: 'clamp',
    });

    // ── Scroll strip to place a date at position 3 (0-indexed) ──
    const scrollStripToDate = useCallback(
        (dateStr: string, animated = true) => {
            const idx = stripDates.indexOf(dateStr);
            if (idx >= 3) {
                stripRef.current?.scrollToIndex({ index: idx - 3, animated, viewPosition: 0 });
            }
        },
        [stripDates],
    );

    // Expose scroll-to-today for parent to call on tab focus
    useEffect(() => {
        if (scrollToTodayRef) {
            scrollToTodayRef.current = () => {
                onSelectDate(today);
                scrollStripToDate(today);
            };
        }
    }, [scrollToTodayRef, today, onSelectDate, scrollStripToDate]);

    // ── animateTo (stable ref so PanResponder closure never goes stale) ──
    const animateToRef = useRef<(v: number) => void>(() => {});
    animateToRef.current = (toValue: number) => {
        const willExpand = toValue === 1;
        isExpandedRef.current = willExpand;
        setIsExpanded(willExpand);

        if (willExpand) {
            const d = new Date(selectedDate + 'T00:00:00');
            setDisplayMonth({ year: d.getFullYear(), month: d.getMonth() });
        } else {
            // Sync strip to selected date when collapsing
            setTimeout(() => {
                const idx = stripDates.indexOf(selectedDate);
                if (idx >= 3) {
                    stripRef.current?.scrollToIndex({ index: idx - 3, animated: false, viewPosition: 0 });
                }
            }, 50);
        }

        Animated.spring(expandAnim, {
            toValue,
            useNativeDriver: false,
            tension: 65,
            friction: 12,
        }).start();
    };

    // ── PanResponder — covers full calendar surface ──
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
            onPanResponderMove: (_, gs) => {
                const base = isExpandedRef.current ? 1 : 0;
                const range = CAL_MONTH_H - CAL_WEEK_H;
                const next = Math.max(0, Math.min(1, base + gs.dy / range));
                expandAnim.setValue(next);
            },
            onPanResponderRelease: (_, gs) => {
                const current = (expandAnim as any)._value as number;
                const shouldExpand = Math.abs(gs.vy) > 0.3 ? gs.vy > 0 : current > 0.5;
                animateToRef.current(shouldExpand ? 1 : 0);
            },
        }),
    ).current;

    // ── Month grid navigation ──
    const navigateMonth = (delta: number) => {
        setDisplayMonth((prev) => {
            const d = new Date(prev.year, prev.month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    };

    const monthLabel = new Date(displayMonth.year, displayMonth.month, 1).toLocaleDateString('en-SG', {
        month: 'long',
        year: 'numeric',
    });

    // ── Strip scroll -> update month label + today visibility ──
    const onStripScroll = useCallback(
        (e: any) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const firstVisibleIdx = Math.round(offsetX / CELL_W);
            const centerIdx = firstVisibleIdx + 3;
            const clamped = Math.max(0, Math.min(centerIdx, stripDates.length - 1));
            const dateStr = stripDates[clamped];
            if (dateStr) {
                const d = new Date(dateStr + 'T00:00:00');
                const label = d.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
                setWeekMonthLabel((prev) => (prev === label ? prev : label));
            }
            const isVisible = todayIdx >= firstVisibleIdx && todayIdx < firstVisibleIdx + 7;
            setTodayVisible(isVisible);
        },
        [stripDates, todayIdx],
    );

    // ── Render strip day cell ──
    const renderStripDay = useCallback(
        ({ item: dateStr }: { item: string }) => {
            const d = new Date(dateStr + 'T00:00:00');
            const dow = DOW_LETTERS[(d.getDay() + 6) % 7];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const hasEvent = eventDates.has(dateStr);

            return (
                <TouchableOpacity
                    style={[calStyles.stripCell, { width: CELL_W }]}
                    onPress={() => {
                        onSelectDate(dateStr);
                        scrollStripToDate(dateStr);
                    }}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            calStyles.stripDow,
                            { color: isToday && !isSelected ? colors.accent : colors.textTertiary },
                        ]}
                    >
                        {dow}
                    </Text>
                    <View
                        style={[
                            calStyles.stripCircle,
                            isSelected && { backgroundColor: colors.accent },
                            isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.accent },
                        ]}
                    >
                        <Text
                            style={[
                                calStyles.stripDayText,
                                {
                                    color: isSelected
                                        ? colors.textInverse
                                        : isToday
                                          ? colors.accent
                                          : colors.textPrimary,
                                    fontWeight: isSelected || isToday ? '700' : '500',
                                },
                            ]}
                        >
                            {d.getDate()}
                        </Text>
                    </View>
                    <View
                        style={[
                            calStyles.dot,
                            {
                                backgroundColor: hasEvent
                                    ? isSelected
                                        ? colors.textInverse
                                        : colors.accent
                                    : 'transparent',
                            },
                        ]}
                    />
                </TouchableOpacity>
            );
        },
        [selectedDate, today, eventDates, colors, onSelectDate, scrollStripToDate],
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: CELL_W,
            offset: CELL_W * index,
            index,
        }),
        [],
    );

    return (
        <Animated.View
            style={[
                calStyles.container,
                { backgroundColor: colors.cardBackground, height: calHeight, borderBottomColor: colors.border },
            ]}
            {...panResponder.panHandlers}
        >
            {/* ── Header ── */}
            <View style={calStyles.header}>
                {/* Week mode — month label + Today button */}
                <Animated.View
                    style={[calStyles.headerRow, { opacity: weekLabelOpacity }]}
                    pointerEvents={isExpanded ? 'none' : 'auto'}
                >
                    <Text style={[calStyles.monthText, { color: colors.textPrimary }]}>{weekMonthLabel}</Text>
                    {!todayVisible && (
                        <TouchableOpacity
                            onPress={() => {
                                onSelectDate(today);
                                scrollStripToDate(today);
                            }}
                            style={[calStyles.todayBtn, { borderColor: colors.accent }]}
                            hitSlop={HIT}
                        >
                            <Text style={[calStyles.todayBtnText, { color: colors.accent }]}>Today</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Month mode — arrows + label */}
                <Animated.View
                    style={[calStyles.headerRow, calStyles.headerOverlay, { opacity: monthLabelOpacity }]}
                    pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                    <TouchableOpacity onPress={() => navigateMonth(-1)} hitSlop={HIT}>
                        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[calStyles.monthText, { color: colors.textPrimary }]}>{monthLabel}</Text>
                    <TouchableOpacity onPress={() => navigateMonth(1)} hitSlop={HIT}>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* ── Content area (cross-fades between strip and month grid) ── */}
            <Animated.View style={{ height: contentH, overflow: 'hidden' }}>
                {/* Week strip — horizontal scroll */}
                <Animated.View
                    style={{ height: STRIP_H, opacity: stripOpacity }}
                    pointerEvents={isExpanded ? 'none' : 'auto'}
                >
                    <FlatList
                        ref={stripRef}
                        data={stripDates}
                        keyExtractor={(item) => item}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        getItemLayout={getItemLayout}
                        initialScrollIndex={initialIdx}
                        onScrollToIndexFailed={() => {}}
                        onLayout={() => requestAnimationFrame(() => scrollStripToDate(today, false))}
                        renderItem={renderStripDay}
                        onScroll={onStripScroll}
                        scrollEventThrottle={100}
                        extraData={selectedDate}
                    />
                </Animated.View>

                {/* Month grid — absolute overlay */}
                <Animated.View
                    style={[calStyles.gridOverlay, { opacity: gridOpacity }]}
                    pointerEvents={isExpanded ? 'auto' : 'none'}
                >
                    {/* Day-of-week initials */}
                    <View style={calStyles.dayLabels}>
                        {DOW_LETTERS.map((lbl, i) => (
                            <View key={i} style={calStyles.dayLabelCell}>
                                <Text style={[calStyles.dayLabelText, { color: colors.textTertiary }]}>{lbl}</Text>
                            </View>
                        ))}
                    </View>

                    {monthGrid.map((week, wi) => (
                        <View key={wi} style={calStyles.gridRow}>
                            {week.map((date, di) => {
                                if (!date) return <View key={di} style={calStyles.gridCell} />;

                                const ds = toDateStr(date);
                                const isSelected = ds === selectedDate;
                                const isToday = ds === today;
                                const hasEvent = eventDates.has(ds);
                                const isOtherMon = date.getMonth() !== displayMonth.month;

                                return (
                                    <TouchableOpacity
                                        key={di}
                                        style={calStyles.gridCell}
                                        onPress={() => {
                                            onSelectDate(ds);
                                            if (isOtherMon) {
                                                setDisplayMonth({ year: date.getFullYear(), month: date.getMonth() });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[
                                                calStyles.gridCircle,
                                                isSelected && { backgroundColor: colors.accent },
                                                isToday &&
                                                    !isSelected && { borderWidth: 1.5, borderColor: colors.accent },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    calStyles.gridDayText,
                                                    {
                                                        color: isSelected
                                                            ? colors.textInverse
                                                            : isToday
                                                              ? colors.accent
                                                              : isOtherMon
                                                                ? colors.textTertiary
                                                                : colors.textPrimary,
                                                        fontWeight: isSelected ? '700' : '500',
                                                    },
                                                ]}
                                            >
                                                {date.getDate()}
                                            </Text>
                                        </View>
                                        {hasEvent && (
                                            <View
                                                style={[
                                                    calStyles.dot,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? colors.textInverse
                                                            : colors.accent,
                                                    },
                                                ]}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </Animated.View>
            </Animated.View>

            {/* ── Drag handle ── */}
            <View style={calStyles.handleArea}>
                <View style={[calStyles.handlePill, { backgroundColor: colors.divider }]} />
            </View>
        </Animated.View>
    );
}

const calStyles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    header: {
        height: CAL_HEADER_H,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: letterSpacing(-0.2),
    },
    todayBtn: {
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    todayBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    // Week strip
    stripCell: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: STRIP_H,
    },
    stripDow: {
        fontSize: 11,
        fontWeight: '600',
    },
    stripCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stripDayText: {
        fontSize: 15,
    },
    // Month grid
    gridOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    dayLabels: {
        height: GRID_LABELS_H,
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    dayLabelCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayLabelText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    gridRow: {
        height: GRID_ROW_H,
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    gridCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    gridCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridDayText: {
        fontSize: 14,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    handleArea: {
        height: CAL_HANDLE_H,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handlePill: {
        width: 36,
        height: 4,
        borderRadius: 2,
        opacity: 0.6,
    },
});
