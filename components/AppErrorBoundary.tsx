import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sentry } from '@/lib/sentry';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        Sentry.captureException(error);
    }

    handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>An unexpected error occurred. Please try again.</Text>
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A2E',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
