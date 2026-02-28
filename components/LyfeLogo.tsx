import { useTheme } from '@/contexts/ThemeContext';
import { useFonts } from 'expo-font';
import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

interface LyfeLogoProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const SIZES: Record<string, TextStyle> = {
    sm: { fontSize: 20, lineHeight: 28 },
    md: { fontSize: 32, lineHeight: 40 },
    lg: { fontSize: 48, lineHeight: 60 },
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
            Lyfe
        </Text>
    );
}

const styles = StyleSheet.create({
    logo: {
        letterSpacing: 1,
    },
});
