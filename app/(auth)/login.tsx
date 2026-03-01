import LyfeLogo from '@/components/LyfeLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
    const { colors, isDark } = useTheme();
    const { signInWithOtp, verifyOtp } = useAuth();

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('+65');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const otpRefs = useRef<(TextInput | null)[]>([]);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateTransition = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        setTimeout(callback, 150);
    };

    const handleSendOtp = async () => {
        if (phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }
        setError(null);
        setIsLoading(true);
        const { error: otpError } = await signInWithOtp(phone);
        setIsLoading(false);
        if (otpError) {
            setError(otpError.message);
            return;
        }
        animateTransition(() => setStep('otp'));
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5) {
            const code = newOtp.join('');
            if (code.length === 6) {
                handleVerifyOtp(code);
            }
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (code?: string) => {
        const otpCode = code || otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }
        setError(null);
        setIsLoading(true);
        const { error: verifyError } = await verifyOtp(phone, otpCode);
        setIsLoading(false);
        if (verifyError) {
            setError(verifyError.message);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LyfeLogo size="lg" />
                        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                            Insurance, simplified.
                        </Text>
                    </View>

                    {/* Form */}
                    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                        {step === 'phone' ? (
                            <>
                                <Text style={[styles.heading, { color: colors.textPrimary }]}>
                                    Welcome back
                                </Text>
                                <Text style={[styles.subheading, { color: colors.textSecondary }]}>
                                    Enter your phone number to continue
                                </Text>

                                <View
                                    style={[
                                        styles.phoneInputContainer,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: error ? colors.danger : colors.inputBorder,
                                        },
                                    ]}
                                >
                                    <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={[styles.phoneInput, { color: colors.textPrimary }]}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        placeholder="+65 9XXX XXXX"
                                        placeholderTextColor={colors.textTertiary}
                                        autoFocus
                                    />
                                </View>

                                {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                                    onPress={handleSendOtp}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.heading, { color: colors.textPrimary }]}>
                                    Verify your number
                                </Text>
                                <Text style={[styles.subheading, { color: colors.textSecondary }]}>
                                    Enter the 6-digit code sent to {phone}
                                </Text>

                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => { otpRefs.current[index] = ref; }}
                                            style={[
                                                styles.otpInput,
                                                {
                                                    backgroundColor: colors.inputBackground,
                                                    borderColor: digit
                                                        ? colors.accent
                                                        : error
                                                            ? colors.danger
                                                            : colors.inputBorder,
                                                    color: colors.textPrimary,
                                                },
                                            ]}
                                            value={digit}
                                            onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            autoFocus={index === 0}
                                            selectTextOnFocus
                                        />
                                    ))}
                                </View>

                                {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                                    onPress={() => handleVerifyOtp()}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Verify</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.linkButton}
                                    onPress={() => {
                                        setError(null);
                                        setOtp(['', '', '', '', '', '']);
                                        animateTransition(() => setStep('phone'));
                                    }}
                                >
                                    <Text style={[styles.linkText, { color: colors.accent }]}>
                                        Use a different number
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>

                    {/* Footer */}
                    <Text style={[styles.footer, { color: colors.textTertiary }]}>
                        By continuing, you agree to Lyfe's Terms of Service
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    tagline: {
        fontSize: 15,
        marginTop: 8,
        letterSpacing: 0.3,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subheading: {
        fontSize: 15,
        marginBottom: 24,
        lineHeight: 22,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 8,
    },
    phonePrefix: {
        fontSize: 18,
        marginRight: 12,
    },
    phoneInput: {
        flex: 1,
        fontSize: 17,
        letterSpacing: 0.5,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderWidth: 1.5,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 13,
        marginBottom: 16,
        marginTop: 4,
    },
    primaryButton: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
        padding: 8,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 48,
        lineHeight: 18,
    },
});
