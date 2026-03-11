import React, { useCallback } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Touchable from '@/components/Touchable';
import type { RoadmapProgramme } from '@/types/roadmap';
import { displayWeight } from '@/constants/platform';
import { ANIM } from '@/constants/ui';
import type { ThemeColors } from '@/types/theme';

interface Props {
    programmes: RoadmapProgramme[];
    activeIndex: number;
    onSelect: (index: number) => void;
    colors: ThemeColors;
}

function ProgrammeTabs({ programmes, activeIndex, onSelect, colors }: Props) {
    const { width: screenWidth } = useWindowDimensions();
    const indicatorX = useSharedValue(0);

    // 32 = marginHorizontal * 2, 4 = padding * 2
    const tabWidth = Math.floor((screenWidth - 32 - 4) / programmes.length);

    const handleSelect = useCallback(
        (index: number) => {
            indicatorX.value = withTiming(index, { duration: ANIM.TRANSITION, easing: Easing.out(Easing.cubic) });
            onSelect(index);
        },
        [onSelect, indicatorX],
    );

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value * tabWidth }],
    }));

    if (programmes.length < 2) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.border }]}>
            <Animated.View
                style={[styles.indicator, { backgroundColor: colors.surfacePrimary, width: tabWidth }, indicatorStyle]}
            />
            {programmes.map((p, i) => (
                <Touchable
                    key={p.id}
                    style={[styles.tab, { width: tabWidth }]}
                    onPress={() => handleSelect(i)}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: i === activeIndex }}
                    accessibilityLabel={p.title}
                >
                    <Text
                        style={[
                            styles.tabText,
                            { color: i === activeIndex ? colors.textPrimary : colors.textTertiary },
                            i === activeIndex && styles.tabTextActive,
                        ]}
                    >
                        {p.title}
                    </Text>
                </Touchable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 10,
        padding: 2,
        height: 44,
    },
    indicator: {
        position: 'absolute',
        top: 2,
        left: 2,
        height: 40,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tabTextActive: {
        fontWeight: displayWeight('600'),
    },
});

export default React.memo(ProgrammeTabs);
