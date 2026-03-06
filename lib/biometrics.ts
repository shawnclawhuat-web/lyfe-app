import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'lyfe_biometrics_enabled';
const BIOMETRICS_PROMPT_SHOWN_KEY = 'lyfe_biometrics_prompt_shown';

export type BiometryType = 'faceid' | 'touchid' | 'none';

export async function getBiometryType(): Promise<BiometryType> {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) return 'none';
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) return 'none';
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceid';
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'touchid';
        return 'none';
    } catch {
        return 'none';
    }
}

export async function isBiometricsAvailable(): Promise<boolean> {
    const type = await getBiometryType();
    return type !== 'none';
}

export async function isBiometricsEnabled(): Promise<boolean> {
    try {
        const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
        return val === 'true';
    } catch {
        return false;
    }
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
        await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
        await SecureStore.setItemAsync(BIOMETRICS_PROMPT_SHOWN_KEY, 'true');
    } else {
        await SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY);
    }
}

export async function hasShownBiometricsPrompt(): Promise<boolean> {
    try {
        const val = await SecureStore.getItemAsync(BIOMETRICS_PROMPT_SHOWN_KEY);
        return val === 'true';
    } catch {
        return false;
    }
}

export async function markBiometricsPromptShown(): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRICS_PROMPT_SHOWN_KEY, 'true');
}

export async function authenticate(promptMessage: string): Promise<boolean> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: 'Cancel',
            disableDeviceFallback: true,
        });
        return result.success;
    } catch {
        return false;
    }
}
