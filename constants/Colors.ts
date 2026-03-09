/**
 * Lyfe App — iOS-Native Color System
 * Accent: Vibrant Orange #FF7600
 * Inspired by Apple Health, iOS Settings, Notion
 *
 * Design principles:
 * - Restrained color — accent only for interactive elements
 * - iOS system backgrounds (#F2F2F7 grouped, #FFFFFF cards)
 * - No card borders — contrast between bg layers
 * - Typography-driven hierarchy
 */

const orange = {
    primary: '#FF7600',
    light: '#FFF1E5',
    dark: '#CC5E00',
    muted: '#FFB366',
};

export const Colors = {
    light: {
        // Backgrounds — iOS system grouped
        background: '#F2F2F7',
        surfacePrimary: '#FFFFFF',
        surfaceSecondary: '#F2F2F7',
        surfaceElevated: '#FFFFFF',

        // Text — true black hierarchy
        textPrimary: '#000000',
        textSecondary: '#3C3C43',
        textTertiary: '#8E8E93',
        textInverse: '#FFFFFF',

        // Accent — vibrant orange
        accent: orange.primary,
        accentLight: orange.light,
        accentDark: orange.dark,
        accentMuted: orange.muted,

        // Semantic
        success: '#34C759',
        successLight: '#E8F9ED',
        warning: '#EAB308',
        warningLight: '#FEF9C3',
        danger: '#FF3B30',
        dangerLight: '#FFEDEC',
        info: '#007AFF',
        infoLight: '#E5F1FF',

        // Borders & Dividers
        border: '#E5E5EA',
        borderLight: '#F2F2F7',
        divider: '#C6C6C8',

        // Cards & Components — borderless design
        cardBackground: '#FFFFFF',
        cardBorder: 'transparent',
        tabBar: '#FFFFFF',
        tabBarBorder: '#E5E5EA',
        inputBackground: '#FFFFFF',
        inputBorder: '#E5E5EA',

        // Manager role
        managerColor: '#6366F1',
        managerColorLight: '#EEF2FF',

        // Status pills — muted tones
        statusNew: '#007AFF',
        statusContacted: '#EAB308',
        statusQualified: '#34C759',
        statusProposed: '#AF52DE',
        statusWon: '#34C759',
        statusLost: '#FF3B30',

        // WebView (MathRenderer)
        webViewBg: '#FFFFFF',
        webViewText: '#1F2328',

        // Shadows (iOS)
        shadow: 'rgba(0, 0, 0, 0.04)',

        // Tab bar icons
        tabIconDefault: '#8E8E93',
        tabIconSelected: orange.primary,
    },
    dark: {
        // Backgrounds — true black
        background: '#000000',
        surfacePrimary: '#1C1C1E',
        surfaceSecondary: '#000000',
        surfaceElevated: '#2C2C2E',

        // Text
        textPrimary: '#FFFFFF',
        textSecondary: '#EBEBF5',
        textTertiary: '#8E8E93',
        textInverse: '#000000',

        // Accent
        accent: '#FF8A2E',
        accentLight: '#2D1F0A',
        accentDark: orange.primary,
        accentMuted: '#B85A1A',

        // Semantic
        success: '#30D158',
        successLight: '#0E2916',
        warning: '#FACC15',
        warningLight: '#2D2B0A',
        danger: '#FF453A',
        dangerLight: '#2D1214',
        info: '#0A84FF',
        infoLight: '#0A1A2D',

        // Borders & Dividers
        border: '#38383A',
        borderLight: '#2C2C2E',
        divider: '#38383A',

        // Cards & Components
        cardBackground: '#1C1C1E',
        cardBorder: 'transparent',
        tabBar: '#1C1C1E',
        tabBarBorder: '#38383A',
        inputBackground: '#2C2C2E',
        inputBorder: '#38383A',

        // Manager role
        managerColor: '#818CF8',
        managerColorLight: '#312E81',

        // Status pills
        statusNew: '#0A84FF',
        statusContacted: '#FACC15',
        statusQualified: '#30D158',
        statusProposed: '#BF5AF2',
        statusWon: '#30D158',
        statusLost: '#FF453A',

        // WebView (MathRenderer)
        webViewBg: '#161B22',
        webViewText: '#E6EDF3',

        // Shadows
        shadow: 'rgba(0, 0, 0, 0.5)',

        // Tab bar icons
        tabIconDefault: '#8E8E93',
        tabIconSelected: '#FF8A2E',
    },
};
