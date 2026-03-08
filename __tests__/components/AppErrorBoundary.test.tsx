import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import { Sentry } from '@/lib/sentry';
import { Text } from 'react-native';

jest.mock('@/lib/sentry', () => ({
    Sentry: { captureException: jest.fn() },
}));

// Component that throws on demand
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error('Boom');
    return <Text>Child rendered</Text>;
}

beforeEach(() => jest.clearAllMocks());

describe('AppErrorBoundary', () => {
    it('renders children when no error', () => {
        const { getByText } = render(
            <AppErrorBoundary>
                <Bomb shouldThrow={false} />
            </AppErrorBoundary>,
        );
        expect(getByText('Child rendered')).toBeTruthy();
    });

    it('shows fallback UI when child throws', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const { getByText } = render(
            <AppErrorBoundary>
                <Bomb shouldThrow={true} />
            </AppErrorBoundary>,
        );
        expect(getByText('Something went wrong')).toBeTruthy();
        expect(getByText('Try Again')).toBeTruthy();
        consoleSpy.mockRestore();
    });

    it('calls Sentry.captureException on error', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        render(
            <AppErrorBoundary>
                <Bomb shouldThrow={true} />
            </AppErrorBoundary>,
        );
        expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('recovers when Try Again is pressed', () => {
        let shouldThrow = true;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        function DynamicBomb() {
            if (shouldThrow) throw new Error('Boom');
            return <Text>Recovered</Text>;
        }

        const { getByText } = render(
            <AppErrorBoundary>
                <DynamicBomb />
            </AppErrorBoundary>,
        );
        expect(getByText('Something went wrong')).toBeTruthy();

        shouldThrow = false;
        fireEvent.press(getByText('Try Again'));
        expect(getByText('Recovered')).toBeTruthy();
        consoleSpy.mockRestore();
    });
});
