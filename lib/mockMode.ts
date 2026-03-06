/**
 * Dev-only mock mode singleton.
 * Initialized async from AsyncStorage at app startup (before screens render).
 * Persists across sessions so the toggle survives app restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lyfe_dev_mock_mode';

// Start from the env var default
let _isMock = process.env.EXPO_PUBLIC_MOCK_OTP === 'true';

/** Call once at app startup (inside AuthContext.initAuth) before isLoading → false */
export async function initMockMode(): Promise<void> {
    if (!__DEV__) return;
    const stored = await AsyncStorage.getItem(KEY);
    if (stored !== null) _isMock = stored === 'true';
}

/** Returns current mock mode. Safe to call at render time after initMockMode has resolved. */
export function isMockMode(): boolean {
    return __DEV__ && _isMock;
}

/** Persist a new mock mode value. Call this then signOut() to take effect on next login. */
export async function setMockMode(value: boolean): Promise<void> {
    _isMock = value;
    await AsyncStorage.setItem(KEY, String(value));
}
