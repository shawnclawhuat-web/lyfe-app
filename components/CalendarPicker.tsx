import { toDateStr } from '@/lib/dateTime';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const DAY_SIZE = Math.floor((SCREEN_W - 64) / 7); // 7 columns with padding
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarPickerProps {
    visible: boolean;
    selectedDate: string; // YYYY-MM-DD
    onSelect: (date: string) => void;
    onClose: () => void;
    colors: any;
    /** Optional: highlight a range end date (for roadshow date range) */
    rangeEnd?: string;
    /** Optional: title override */
    title?: string;
}

/** Build a 6-row Mon-first calendar grid */
function buildGrid(year: number, month: number): (Date | null)[][] {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = (first.getDay() + 6) % 7; // Mon=0

    // Fill previous month days
    const cells: (Date | null)[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        cells.push(d);
    }
    // Current month
    for (let d = 1; d <= last.getDate(); d++) {
        cells.push(new Date(year, month, d));
    }
    // Fill remaining cells with next month
    while (cells.length < 42) {
        const nextDay = cells.length - startDow - last.getDate() + 1;
        cells.push(new Date(year, month + 1, nextDay));
    }

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

export default function CalendarPicker({
    visible,
    selectedDate,
    onSelect,
    onClose,
    colors,
    rangeEnd,
    title = 'Select Date',
}: CalendarPickerProps) {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [isRendered, setIsRendered] = useState(false);

    // Parse initial month from selected date
    const initDate = new Date(selectedDate + 'T00:00:00');
    const [displayMonth, setDisplayMonth] = useState({
        year: initDate.getFullYear(),
        month: initDate.getMonth(),
    });

    // Reset month when picker opens with a new date
    React.useEffect(() => {
        if (visible) {
            const d = new Date(selectedDate + 'T00:00:00');
            setDisplayMonth({ year: d.getFullYear(), month: d.getMonth() });
            setIsRendered(true);
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                damping: 20,
                stiffness: 200,
            }).start();
        } else {
            slideAnim.setValue(0);
        }
    }, [visible]);

    const handleClose = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setIsRendered(false);
            onClose();
        });
    }, [onClose]);

    const handleSelect = useCallback(
        (date: Date) => {
            onSelect(toDateStr(date));
            handleClose();
        },
        [onSelect, handleClose],
    );

    const grid = useMemo(
        () => buildGrid(displayMonth.year, displayMonth.month),
        [displayMonth.year, displayMonth.month],
    );

    const todayStr = toDateStr(new Date());

    const monthLabel = new Date(displayMonth.year, displayMonth.month, 1).toLocaleDateString('en-SG', {
        month: 'long',
        year: 'numeric',
    });

    const navigateMonth = (delta: number) => {
        setDisplayMonth((prev) => {
            const d = new Date(prev.year, prev.month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    };

    // Determine range for highlighting
    const rangeStart = rangeEnd && selectedDate < rangeEnd ? selectedDate : undefined;
    const rangeEndStr = rangeEnd && selectedDate < rangeEnd ? rangeEnd : undefined;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [500, 0],
    });

    const backdropOpacity = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.4],
    });

    if (!visible && !isRendered) return null;

    return (
        <Modal visible={visible || isRendered} transparent animationType="none" onRequestClose={handleClose}>
            <View style={s.overlay}>
                <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        s.sheet,
                        {
                            backgroundColor: colors.cardBackground,
                            transform: [{ translateY }],
                        },
                    ]}
                >
                    {/* Handle */}
                    <View style={[s.handle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={s.header}>
                        <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
                        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.accent }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Month navigation */}
                    <View style={s.monthNav}>
                        <TouchableOpacity
                            onPress={() => navigateMonth(-1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[s.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>
                        <TouchableOpacity
                            onPress={() => navigateMonth(1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Day-of-week labels */}
                    <View style={s.dowRow}>
                        {DOW_LABELS.map((d) => (
                            <View key={d} style={[s.dowCell, { width: DAY_SIZE }]}>
                                <Text style={[s.dowText, { color: colors.textTertiary }]}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Grid */}
                    <View style={s.gridContainer}>
                        {grid.map((week, wi) => (
                            <View key={wi} style={s.weekRow}>
                                {week.map((date, di) => {
                                    if (!date) {
                                        return <View key={di} style={[s.dayCell, { width: DAY_SIZE }]} />;
                                    }

                                    const ds = toDateStr(date);
                                    const isCurrentMonth = date.getMonth() === displayMonth.month;
                                    const isSelected = ds === selectedDate;
                                    const isToday = ds === todayStr;
                                    const isRangeEnd = ds === rangeEndStr;
                                    const isInRange = rangeStart && rangeEndStr && ds > rangeStart && ds < rangeEndStr;

                                    return (
                                        <TouchableOpacity
                                            key={di}
                                            style={[s.dayCell, { width: DAY_SIZE }]}
                                            onPress={() => handleSelect(date)}
                                            activeOpacity={0.6}
                                        >
                                            {/* Range highlight background */}
                                            {isInRange && (
                                                <View style={[s.rangeBg, { backgroundColor: colors.accent + '15' }]} />
                                            )}
                                            {(isSelected || isRangeEnd) && rangeStart && (
                                                <View
                                                    style={[
                                                        s.rangeBg,
                                                        {
                                                            backgroundColor: colors.accent + '15',
                                                            width: '50%',
                                                            [isSelected ? 'right' : 'left']: 0,
                                                            [isSelected ? 'left' : 'right']: undefined,
                                                        },
                                                    ]}
                                                />
                                            )}

                                            <View
                                                style={[
                                                    s.dayCircle,
                                                    isSelected && { backgroundColor: colors.accent },
                                                    isRangeEnd && { backgroundColor: colors.accent },
                                                    isToday &&
                                                        !isSelected &&
                                                        !isRangeEnd && {
                                                            borderWidth: 1.5,
                                                            borderColor: colors.accent,
                                                        },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        s.dayText,
                                                        {
                                                            color:
                                                                isSelected || isRangeEnd
                                                                    ? '#FFFFFF'
                                                                    : isToday
                                                                      ? colors.accent
                                                                      : isCurrentMonth
                                                                        ? colors.textPrimary
                                                                        : colors.textTertiary + '60',
                                                            fontWeight:
                                                                isSelected || isRangeEnd || isToday ? '700' : '400',
                                                        },
                                                    ]}
                                                >
                                                    {date.getDate()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Today shortcut */}
                    <TouchableOpacity
                        style={[s.todayBtn, { borderColor: colors.accent }]}
                        onPress={() => {
                            const now = new Date();
                            setDisplayMonth({ year: now.getFullYear(), month: now.getMonth() });
                            handleSelect(now);
                        }}
                    >
                        <Text style={[s.todayBtnText, { color: colors.accent }]}>Today</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 36,
        paddingHorizontal: 16,
    },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    title: { fontSize: 17, fontWeight: '600' },

    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    monthLabel: { fontSize: 16, fontWeight: '700' },

    dowRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
    dowCell: { alignItems: 'center', paddingVertical: 4 },
    dowText: { fontSize: 12, fontWeight: '600' },

    gridContainer: { paddingHorizontal: 0 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
    dayCell: {
        height: DAY_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: { fontSize: 15 },
    rangeBg: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 0,
        right: 0,
        borderRadius: 0,
    },

    todayBtn: {
        alignSelf: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    todayBtnText: { fontSize: 14, fontWeight: '600' },
});
