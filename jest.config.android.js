/**
 * Android-specific Jest config.
 *
 * Run with: npx jest --config jest.config.android.js
 *
 * Uses jest-expo/android preset so Platform.OS === 'android'.
 * Only runs platform-specific tests — not the full suite
 * (component rendering may differ under android preset).
 */
module.exports = {
    ...require('./jest.config'),
    preset: 'jest-expo/android',
    displayName: 'Android',
    testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
    testMatch: ['**/__tests__/constants/platform.android.test.ts'],
};
