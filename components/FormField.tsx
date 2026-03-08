import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

interface FormFieldProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    error?: string;
    colors: any;
    icon?: string;
    required?: boolean;
    keyboardType?: 'default' | 'phone-pad' | 'email-address';
    autoCapitalize?: 'none' | 'sentences' | 'words';
    containerStyle?: ViewStyle;
}

export default function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    colors,
    icon,
    required,
    keyboardType,
    autoCapitalize,
    containerStyle,
}: FormFieldProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
                {label}
                {required && <Text style={{ color: colors.danger }}> *</Text>}
            </Text>
            {icon ? (
                <View
                    style={[
                        styles.inputRow,
                        {
                            backgroundColor: colors.surfacePrimary,
                            borderColor: error ? '#EF4444' : colors.borderLight,
                        },
                    ]}
                >
                    <Ionicons name={icon as any} size={18} color={error ? '#EF4444' : colors.textTertiary} />
                    <TextInput
                        style={[styles.inputWithIcon, { color: colors.textPrimary }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                    />
                </View>
            ) : (
                <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
            )}
            {error && <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
        borderWidth: 0.5,
        paddingHorizontal: 14,
        minHeight: 48,
    },
    inputWithIcon: { flex: 1, fontSize: 15, padding: 0 },
    input: { fontSize: 16 },
    error: { fontSize: 12, marginTop: 4, fontWeight: '500' },
});
