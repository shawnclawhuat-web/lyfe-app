module.exports = {
    root: true,
    extends: ['expo', 'prettier'],
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'warn',
        // Catch real bugs
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'react-hooks/exhaustive-deps': 'warn',
        // Relax for RN/Expo patterns — TS handles module resolution
        'import/order': 'off',
        'import/no-unresolved': 'off',
    },
    ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'android/', 'ios/', '__mocks__/', 'supabase/functions/'],
};
