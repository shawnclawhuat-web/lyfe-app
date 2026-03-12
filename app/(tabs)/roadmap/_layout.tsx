import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function RoadmapLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="module/[moduleId]" options={{ presentation: 'card' }} />
        </Stack>
    );
}
