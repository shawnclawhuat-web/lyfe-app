import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initSentry() {
    if (!DSN) return;

    Sentry.init({
        dsn: DSN,
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
        profilesSampleRate: __DEV__ ? 1.0 : 0.1,
        debug: __DEV__,
        enabled: !__DEV__,
    });
}

export { Sentry };
