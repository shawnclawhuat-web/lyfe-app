import { useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import React from 'react';
import { Platform, StyleSheet, Text, type TextStyle } from 'react-native';

interface LyfeLogoProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const isAndroid = Platform.OS === 'android';

// Android clips Pacifico descenders (e.g. "y") at tight lineHeights.
// Bump lineHeight on Android to give descenders room.
const SIZES: Record<string, TextStyle> = {
    sm: { fontSize: 20, lineHeight: isAndroid ? 34 : 28 },
    md: { fontSize: 32, lineHeight: isAndroid ? 48 : 40 },
    lg: { fontSize: 48, lineHeight: isAndroid ? 90 : 72 },
};

/**
 * The Lyfe logo — rendered in Pacifico (cursive) font.
 * One deterministic version used everywhere.
 */
export default function LyfeLogo({ size = 'md', color }: LyfeLogoProps) {
    const { colors } = useTheme();
    const [fontsLoaded] = useFonts({
        Pacifico: require('@/assets/fonts/Pacifico-Regular.ttf'),
    });

    if (!fontsLoaded) return null;

    // Android's text layout measures Pacifico advance widths too narrowly,
    // clipping the trailing cursive "e". A non-breaking space forces the
    // text measurement wider without visually changing the logo.
    const label = isAndroid ? 'Lyfe\u00A0' : 'Lyfe';

    return (
        <Text
            style={[
                styles.logo,
                SIZES[size],
                {
                    color: color || colors.accent,
                    fontFamily: 'Pacifico',
                },
            ]}
        >
            {label}
        </Text>
    );
}

const styles = StyleSheet.create({
    logo: {
        letterSpacing: 1,
    },
});
