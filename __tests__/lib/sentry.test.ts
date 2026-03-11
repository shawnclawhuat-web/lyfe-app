/**
 * Tests for lib/sentry.ts — Sentry initialization and re-export
 */
import * as Sentry from '@sentry/react-native';

// jest.setup.js already mocks @sentry/react-native

describe('sentry', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('does not call Sentry.init when DSN is empty', () => {
        process.env.EXPO_PUBLIC_SENTRY_DSN = '';
        jest.resetModules();
        const { initSentry } = require('@/lib/sentry');

        initSentry();

        expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('calls Sentry.init when DSN is set', () => {
        process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@sentry.io/123';
        jest.resetModules();

        jest.mock('@sentry/react-native', () => ({
            init: jest.fn(),
            wrap: jest.fn((c: any) => c),
            captureException: jest.fn(),
            captureMessage: jest.fn(),
            setUser: jest.fn(),
            addBreadcrumb: jest.fn(),
            mobileReplayIntegration: jest.fn(() => ({ name: 'MobileReplay' })),
        }));

        const sentryMod = require('@/lib/sentry');
        const SentryFresh = require('@sentry/react-native');

        sentryMod.initSentry();

        expect(SentryFresh.init).toHaveBeenCalledWith(
            expect.objectContaining({
                dsn: 'https://abc@sentry.io/123',
            }),
        );
    });

    it('re-exports Sentry module', () => {
        const { Sentry: SentryExport } = require('@/lib/sentry');
        expect(SentryExport).toBeDefined();
        expect(SentryExport.init).toBeDefined();
        expect(SentryExport.captureException).toBeDefined();
    });
});
