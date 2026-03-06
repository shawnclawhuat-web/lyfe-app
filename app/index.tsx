import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

/**
 * Root index route. AuthGate (in _layout.tsx) already blocks rendering while
 * auth is loading, so by the time this component mounts isLoading is always
 * false. We still guard here as a defence-in-depth measure so this component
 * never races with AuthGate's redirect logic.
 */
export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
    return <Redirect href="/(auth)/login" />;
}
