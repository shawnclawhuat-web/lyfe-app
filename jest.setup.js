// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[mock]' }),
    setNotificationHandler: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn().mockResolvedValue(true),
    isEnrolledAsync: jest.fn().mockResolvedValue(true),
    supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([]),
    authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
    },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(() => ({})),
    useFocusEffect: jest.fn((cb) => cb()),
    Link: 'Link',
    Tabs: { Screen: 'Screen' },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    wrap: jest.fn((component) => component),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    addBreadcrumb: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));
