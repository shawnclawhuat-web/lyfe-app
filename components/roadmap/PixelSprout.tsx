import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { SPROUT_PALETTE } from '@/constants/Colors';

const PX = 4;
const SP = SPROUT_PALETTE;

// 18×26 pixel grid — a more developed sprout with fuller leaves and stronger stem
const SPROUT_PIXELS: { x: number; y: number; color: string }[] = [
    // Soil base (row 24-25)
    { x: 4, y: 25, color: SP.soilDark },
    { x: 5, y: 25, color: SP.soilLight },
    { x: 6, y: 25, color: SP.soilLight },
    { x: 7, y: 25, color: SP.soilLight },
    { x: 8, y: 25, color: SP.soilLight },
    { x: 9, y: 25, color: SP.soilLight },
    { x: 10, y: 25, color: SP.soilLight },
    { x: 11, y: 25, color: SP.soilLight },
    { x: 12, y: 25, color: SP.soilLight },
    { x: 13, y: 25, color: SP.soilDark },
    { x: 5, y: 24, color: SP.soilLight },
    { x: 6, y: 24, color: SP.soilMedium },
    { x: 7, y: 24, color: SP.soilMedium },
    { x: 8, y: 24, color: SP.soilMedium },
    { x: 9, y: 24, color: SP.soilMedium },
    { x: 10, y: 24, color: SP.soilMedium },
    { x: 11, y: 24, color: SP.soilMedium },
    { x: 12, y: 24, color: SP.soilLight },
    // Stem (row 8-23, center x=8-9)
    ...Array.from({ length: 14 }, (_, i) => [
        { x: 8, y: 23 - i, color: SP.stem },
        { x: 9, y: 23 - i, color: SP.stem },
    ]).flat(),
    // Left branch + leaf cluster (row 12-18)
    { x: 7, y: 17, color: SP.stem },
    { x: 6, y: 16, color: SP.stem },
    { x: 3, y: 17, color: SP.leafDark },
    { x: 4, y: 17, color: SP.leafPrimary },
    { x: 5, y: 17, color: SP.leafPrimary },
    { x: 2, y: 16, color: SP.leafDark },
    { x: 3, y: 16, color: SP.leafPrimary },
    { x: 4, y: 16, color: SP.leafLight },
    { x: 5, y: 16, color: SP.leafLight },
    { x: 2, y: 15, color: SP.leafPrimary },
    { x: 3, y: 15, color: SP.leafLight },
    { x: 4, y: 15, color: SP.leafLight },
    { x: 5, y: 15, color: SP.leafPrimary },
    { x: 3, y: 14, color: SP.leafPrimary },
    { x: 4, y: 14, color: SP.leafLight },
    { x: 5, y: 14, color: SP.leafPrimary },
    { x: 4, y: 13, color: SP.leafPrimary },
    // Right branch + leaf cluster (row 8-14)
    { x: 10, y: 13, color: SP.stem },
    { x: 11, y: 12, color: SP.stem },
    { x: 12, y: 13, color: SP.leafPrimary },
    { x: 13, y: 13, color: SP.leafPrimary },
    { x: 14, y: 13, color: SP.leafDark },
    { x: 12, y: 12, color: SP.leafLight },
    { x: 13, y: 12, color: SP.leafPrimary },
    { x: 14, y: 12, color: SP.leafDark },
    { x: 15, y: 12, color: SP.leafDark },
    { x: 12, y: 11, color: SP.leafPrimary },
    { x: 13, y: 11, color: SP.leafLight },
    { x: 14, y: 11, color: SP.leafLight },
    { x: 15, y: 11, color: SP.leafPrimary },
    { x: 12, y: 10, color: SP.leafPrimary },
    { x: 13, y: 10, color: SP.leafLight },
    { x: 14, y: 10, color: SP.leafPrimary },
    { x: 13, y: 9, color: SP.leafPrimary },
    // Top crown (row 4-9)
    { x: 7, y: 9, color: SP.leafPrimary },
    { x: 8, y: 9, color: SP.stem },
    { x: 9, y: 9, color: SP.stem },
    { x: 10, y: 9, color: SP.leafPrimary },
    { x: 6, y: 8, color: SP.leafPrimary },
    { x: 7, y: 8, color: SP.leafLight },
    { x: 8, y: 8, color: SP.leafLight },
    { x: 9, y: 8, color: SP.leafLight },
    { x: 10, y: 8, color: SP.leafLight },
    { x: 11, y: 8, color: SP.leafPrimary },
    { x: 6, y: 7, color: SP.leafLight },
    { x: 7, y: 7, color: SP.leafHighlight },
    { x: 8, y: 7, color: SP.leafLight },
    { x: 9, y: 7, color: SP.leafHighlight },
    { x: 10, y: 7, color: SP.leafLight },
    { x: 11, y: 7, color: SP.leafPrimary },
    { x: 7, y: 6, color: SP.leafLight },
    { x: 8, y: 6, color: SP.leafHighlight },
    { x: 9, y: 6, color: SP.leafHighlight },
    { x: 10, y: 6, color: SP.leafLight },
    { x: 7, y: 5, color: SP.leafPrimary },
    { x: 8, y: 5, color: SP.leafLight },
    { x: 9, y: 5, color: SP.leafLight },
    { x: 10, y: 5, color: SP.leafPrimary },
    { x: 8, y: 4, color: SP.leafPrimary },
    { x: 9, y: 4, color: SP.leafPrimary },
];

const GRID_W = 18 * PX;
const GRID_H = 26 * PX;

interface Props {
    size?: number;
    reducedMotion?: boolean;
}

function PixelSprout({ size = 1, reducedMotion }: Props) {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (reducedMotion) return;
        // Unified 3.5s cycle for both sway and breathing (prevents drift)
        rotation.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
                withTiming(-3, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        );
        scale.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
                withTiming(1.0, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true,
        );
    }, [rotation, scale, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    }));

    return (
        <View style={[styles.container, { width: GRID_W * size, height: GRID_H * size }]}>
            <Animated.View
                style={[
                    styles.grid,
                    { width: GRID_W * size, height: GRID_H * size, transformOrigin: 'center bottom' },
                    animatedStyle,
                ]}
            >
                {SPROUT_PIXELS.map((pixel, i) => (
                    <View
                        key={i}
                        style={[
                            styles.pixel,
                            {
                                left: pixel.x * PX * size,
                                top: pixel.y * PX * size,
                                width: PX * size,
                                height: PX * size,
                                backgroundColor: pixel.color,
                                borderRadius: (PX * size) / 4,
                            },
                        ]}
                    />
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    grid: {
        position: 'relative',
    },
    pixel: {
        position: 'absolute',
    },
});

export default React.memo(PixelSprout);
