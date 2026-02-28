import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    resolved: ResolvedTheme;
    colors: typeof Colors.light;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const THEME_STORAGE_KEY = 'lyfe_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isReady, setIsReady] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setModeState(saved);
            }
            setIsReady(true);
        });
    }, []);

    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode);
        AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    }, []);

    const resolved: ResolvedTheme =
        mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

    const colors = Colors[resolved];
    const isDark = resolved === 'dark';

    if (!isReady) return null;

    return (
        <ThemeContext.Provider value={{ mode, resolved, colors, setMode, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
