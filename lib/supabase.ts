import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SecureStore has a 2048-byte limit. For values that exceed it (e.g. Supabase
// session JWTs), fall back to AsyncStorage which has no size limit.
const SECURE_STORE_LIMIT = 2048;

const secureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return null;
            return localStorage.getItem(key);
        }
        // Check AsyncStorage fallback first
        const fallback = await AsyncStorage.getItem(`supabase_as_${key}`);
        if (fallback !== null) return fallback;
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            localStorage.setItem(key, value);
            return;
        }
        if (value.length > SECURE_STORE_LIMIT) {
            // Too large for SecureStore — use AsyncStorage and clear any SecureStore remnant
            await AsyncStorage.setItem(`supabase_as_${key}`, value);
            await SecureStore.deleteItemAsync(key).catch(() => {});
        } else {
            await SecureStore.setItemAsync(key, value);
            await AsyncStorage.removeItem(`supabase_as_${key}`).catch(() => {});
        }
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(key);
            return;
        }
        await Promise.all([
            SecureStore.deleteItemAsync(key).catch(() => {}),
            AsyncStorage.removeItem(`supabase_as_${key}`).catch(() => {}),
        ]);
    },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
