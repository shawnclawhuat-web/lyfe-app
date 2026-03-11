import { Stack } from 'expo-router';

export default function RoadmapLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="module/[moduleId]" options={{ presentation: 'card' }} />
        </Stack>
    );
}
