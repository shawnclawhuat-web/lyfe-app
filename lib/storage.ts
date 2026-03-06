import { supabase } from './supabase';

let _imagePicker: typeof import('expo-image-picker') | null | undefined;

function getImagePicker(): typeof import('expo-image-picker') | null {
    if (_imagePicker !== undefined) return _imagePicker;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('expo-image-picker');
        _imagePicker = mod;
        return mod;
    } catch {
        _imagePicker = null;
        return null;
    }
}

export async function pickAndUploadAvatar(
    userId: string,
): Promise<{ url: string | null; error: string | null }> {
    const ImagePicker = getImagePicker();
    if (!ImagePicker) return { url: null, error: 'Photo uploads require a native rebuild (npx expo run:ios).' };

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return { url: null, error: 'Permission to access photos is required.' };

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled) return { url: null, error: null };
    return _uploadUri(userId, result.assets[0].uri);
}

export async function takeAndUploadAvatar(
    userId: string,
): Promise<{ url: string | null; error: string | null }> {
    const ImagePicker = getImagePicker();
    if (!ImagePicker) return { url: null, error: 'Camera requires a native rebuild (npx expo run:ios).' };

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return { url: null, error: 'Camera permission is required.' };

    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled) return { url: null, error: null };
    return _uploadUri(userId, result.assets[0].uri);
}

export async function removeAvatar(
    userId: string,
): Promise<{ error: string | null }> {
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').remove([path]);
    if (error) return { error: error.message };
    await supabase.from('users').update({ avatar_url: null }).eq('id', userId);
    return { error: null };
}

async function _uploadUri(
    userId: string,
    uri: string,
): Promise<{ url: string | null; error: string | null }> {
    const response = await fetch(uri);
    const blob = await response.blob();
    // Convert to ArrayBuffer — Supabase JS can't serialize RN blobs correctly,
    // resulting in 0-byte uploads. ArrayBuffer works reliably.
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const path = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from('users').update({ avatar_url: url }).eq('id', userId);
    return { url, error: null };
}
