import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    type SharedValue,
} from 'react-native-reanimated';

// 4-shade green palette for the pixel tree
const COLORS = ['#78b84a', '#4daa3d', '#3a9438', '#2d5c2d'] as const;

const PX = 3; // base pixel size in points
const GRID_W = 28; // columns
const GRID_H = 31; // rows

// Per-row sway amplitudes: [rightward, leftward] in source units
// Top rows sway most, bottom (trunk/roots) barely moves
const ROW_SWAY: readonly [number, number][] = [
    [9.0, 6.3],
    [8.4, 5.8],
    [7.8, 5.6],
    [7.4, 5.1],
    [6.8, 4.8],
    [6.3, 4.3],
    [5.7, 4.1],
    [5.2, 3.8],
    [4.8, 3.4],
    [4.3, 3.2],
    [4.1, 2.8],
    [3.6, 2.5],
    [3.3, 2.2],
    [2.8, 2.0],
    [2.5, 1.8],
    [2.2, 1.5],
    [2.0, 1.4],
    [1.7, 1.2],
    [1.5, 1.0],
    [1.2, 0.9],
    [1.0, 0.8],
    [0.8, 0.6],
    [0.6, 0.4],
    [0.4, 0.3],
    [0.3, 0.3],
    [0.3, 0.2],
    [0.2, 0.2],
    [0.2, 0.0],
    [0.0, 0.0],
    [0.0, 0.0],
    [0.0, 0.0],
];

// Pixel data per row: [column, colorIndex][]
// 28×31 grid — a detailed tree with canopy, branches, trunk, and roots
const PIXEL_ROWS: readonly (readonly [number, number])[][] = [
    // Row 0 — canopy top
    [
        [5, 0],
        [6, 1],
        [7, 1],
        [8, 1],
        [9, 1],
        [10, 1],
        [11, 1],
    ],
    // Row 1
    [
        [4, 0],
        [5, 1],
        [6, 0],
        [7, 0],
        [8, 0],
        [9, 0],
        [10, 1],
        [11, 2],
        [12, 2],
    ],
    // Row 2
    [
        [3, 0],
        [4, 2],
        [5, 0],
        [6, 0],
        [7, 0],
        [8, 1],
        [9, 1],
        [10, 1],
        [11, 1],
        [12, 3],
        [19, 2],
        [20, 2],
    ],
    // Row 3
    [
        [2, 0],
        [3, 2],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [8, 1],
        [9, 1],
        [10, 1],
        [11, 3],
        [12, 3],
        [13, 2],
        [18, 1],
        [19, 0],
        [20, 3],
        [21, 2],
        [22, 0],
        [23, 2],
        [24, 2],
        [25, 0],
    ],
    // Row 4
    [
        [2, 0],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [8, 2],
        [9, 3],
        [10, 3],
        [11, 1],
        [12, 1],
        [13, 3],
        [14, 3],
        [15, 2],
        [17, 2],
        [20, 0],
        [21, 3],
        [22, 2],
        [23, 0],
        [24, 0],
        [25, 1],
        [26, 0],
    ],
    // Row 5
    [
        [1, 0],
        [2, 2],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 2],
        [7, 3],
        [8, 2],
        [9, 1],
        [10, 1],
        [11, 1],
        [12, 1],
        [13, 3],
        [15, 3],
        [16, 3],
        [17, 2],
        [19, 0],
        [20, 3],
        [21, 2],
        [22, 1],
        [23, 2],
        [24, 0],
        [25, 0],
        [26, 1],
        [27, 0],
    ],
    // Row 6
    [
        [1, 0],
        [2, 2],
        [3, 1],
        [4, 2],
        [5, 3],
        [6, 1],
        [7, 0],
        [8, 1],
        [9, 1],
        [10, 1],
        [11, 1],
        [12, 2],
        [13, 3],
        [16, 3],
        [19, 3],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 2],
        [24, 0],
        [25, 0],
        [26, 2],
        [27, 0],
    ],
    // Row 7
    [
        [0, 0],
        [1, 2],
        [2, 1],
        [3, 2],
        [4, 1],
        [5, 0],
        [6, 1],
        [7, 1],
        [8, 1],
        [9, 1],
        [10, 2],
        [11, 2],
        [12, 3],
        [16, 3],
        [18, 0],
        [19, 3],
        [20, 1],
        [21, 1],
        [22, 0],
        [23, 1],
        [24, 2],
        [25, 0],
        [26, 0],
        [27, 1],
    ],
    // Row 8
    [
        [0, 0],
        [1, 2],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [8, 2],
        [9, 2],
        [10, 3],
        [11, 3],
        [15, 3],
        [16, 2],
        [18, 3],
        [19, 2],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 2],
        [24, 2],
        [25, 1],
        [26, 1],
        [27, 2],
    ],
    // Row 9
    [
        [0, 0],
        [1, 2],
        [2, 1],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [7, 2],
        [8, 2],
        [9, 2],
        [15, 3],
        [18, 3],
        [19, 2],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 1],
        [24, 2],
        [25, 1],
        [26, 1],
        [27, 2],
    ],
    // Row 10
    [
        [0, 3],
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [7, 0],
        [14, 3],
        [15, 3],
        [19, 3],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 2],
        [24, 2],
        [25, 1],
        [26, 1],
        [27, 2],
    ],
    // Row 11 — canopy bottom / branch gap
    [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 0],
        [13, 3],
        [14, 1],
        [15, 3],
        [19, 3],
        [20, 2],
        [21, 1],
        [22, 1],
        [23, 2],
        [24, 2],
        [25, 1],
        [26, 1],
        [27, 2],
    ],
    // Row 12
    [
        [12, 0],
        [13, 3],
        [14, 2],
        [15, 1],
        [19, 2],
        [20, 2],
        [21, 1],
        [22, 1],
        [23, 1],
        [24, 1],
        [25, 1],
        [26, 1],
        [27, 2],
    ],
    // Row 13
    [
        [11, 0],
        [12, 3],
        [13, 2],
        [14, 1],
        [20, 2],
        [21, 1],
        [22, 1],
        [23, 1],
        [24, 1],
        [25, 1],
        [26, 2],
        [27, 0],
    ],
    // Row 14
    [
        [10, 0],
        [11, 2],
        [12, 2],
        [13, 3],
        [20, 0],
        [21, 3],
        [22, 1],
        [23, 1],
        [24, 1],
        [25, 1],
        [26, 2],
        [27, 0],
    ],
    // Row 15
    [
        [10, 2],
        [11, 2],
        [12, 2],
        [13, 2],
        [21, 2],
        [22, 2],
        [23, 1],
        [24, 1],
        [25, 2],
        [26, 0],
    ],
    // Row 16
    [
        [10, 2],
        [11, 2],
        [12, 3],
        [22, 1],
        [23, 2],
        [24, 2],
        [25, 0],
    ],
    // Row 17
    [
        [9, 0],
        [10, 2],
        [11, 2],
        [12, 3],
        [23, 1],
        [24, 2],
        [25, 0],
    ],
    // Row 18
    [
        [9, 2],
        [10, 2],
        [11, 2],
        [12, 0],
        [24, 0],
    ],
    // Row 19 — trunk
    [
        [9, 2],
        [10, 2],
        [11, 3],
    ],
    // Row 20
    [
        [9, 2],
        [10, 2],
        [11, 3],
    ],
    // Row 21
    [
        [9, 2],
        [10, 2],
        [11, 2],
        [12, 2],
    ],
    // Row 22
    [
        [9, 0],
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 23
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 24
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 25
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 26
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 27
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 28
    [
        [10, 2],
        [11, 2],
        [12, 3],
    ],
    // Row 29 — roots
    [
        [9, 1],
        [10, 2],
        [11, 2],
        [12, 3],
        [13, 3],
    ],
    // Row 30
    [
        [8, 1],
        [9, 3],
        [10, 2],
        [11, 2],
        [12, 2],
        [13, 3],
        [14, 3],
    ],
];

// ── SwayRow: animated per-row translateX wrapper ──

interface SwayRowProps {
    sway: SharedValue<number>;
    ampPos: number;
    ampNeg: number;
    scale: number;
    children: React.ReactNode;
}

const SwayRow = React.memo(function SwayRow({ sway, ampPos, ampNeg, scale, children }: SwayRowProps) {
    const style = useAnimatedStyle(() => {
        'worklet';
        const s = sway.value;
        return {
            transform: [{ translateX: (s >= 0 ? s * ampPos : s * ampNeg) * scale }],
        };
    });

    return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
});

// ── Main component ──

interface Props {
    size?: number; // scale multiplier (default 1)
    reducedMotion?: boolean;
}

function PixelSprout({ size = 1, reducedMotion }: Props) {
    const px = PX * size;
    const gridW = GRID_W * px;
    const gridH = GRID_H * px;
    const swayScale = (size * PX) / 6; // Amplified 2× from proportional for mobile visibility

    const sway = useSharedValue(0);

    useEffect(() => {
        if (reducedMotion) return;
        // 3s cycle: right (0→30%) → left (30→70%) → center (70→100%)
        sway.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
                withTiming(-1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
        );
    }, [sway, reducedMotion]);

    return (
        <View style={{ width: gridW, height: gridH }}>
            {PIXEL_ROWS.map((pixels, rowIdx) => {
                const [ampPos, ampNeg] = ROW_SWAY[rowIdx];
                const isStatic = (ampPos === 0 && ampNeg === 0) || reducedMotion;

                const pixelViews = pixels.map(([col, ci], i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            left: col * px,
                            top: rowIdx * px,
                            width: px,
                            height: px,
                            backgroundColor: COLORS[ci],
                            borderRadius: px / 4,
                        }}
                    />
                ));

                if (isStatic) {
                    return (
                        <View key={rowIdx} style={StyleSheet.absoluteFill}>
                            {pixelViews}
                        </View>
                    );
                }

                return (
                    <SwayRow key={rowIdx} sway={sway} ampPos={ampPos} ampNeg={ampNeg} scale={swayScale}>
                        {pixelViews}
                    </SwayRow>
                );
            })}
        </View>
    );
}

export default React.memo(PixelSprout);
