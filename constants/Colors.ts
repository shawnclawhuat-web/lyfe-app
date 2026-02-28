/**
 * Lyfe App — Semantic Color Tokens
 * Accent: Coral #E8614D
 * Inspired by GitHub Mobile's clean aesthetic
 */

const coral = {
  primary: '#E8614D',
  light: '#FEF0ED',
  dark: '#C24A38',
  muted: '#F5A898',
};

export const Colors = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    surfacePrimary: '#F6F8FA',
    surfaceSecondary: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Text
    textPrimary: '#1F2328',
    textSecondary: '#656D76',
    textTertiary: '#8B949E',
    textInverse: '#FFFFFF',

    // Accent
    accent: coral.primary,
    accentLight: coral.light,
    accentDark: coral.dark,
    accentMuted: coral.muted,

    // Semantic
    success: '#1A7F37',
    successLight: '#DAFBE1',
    warning: '#BF8700',
    warningLight: '#FFF8C5',
    danger: '#CF222E',
    dangerLight: '#FFEBE9',
    info: '#0969DA',
    infoLight: '#DDF4FF',

    // Borders & Dividers
    border: '#D0D7DE',
    borderLight: '#E8ECEF',
    divider: '#D8DEE4',

    // Cards & Components
    cardBackground: '#FFFFFF',
    cardBorder: '#D0D7DE',
    tabBar: '#FFFFFF',
    tabBarBorder: '#D0D7DE',
    inputBackground: '#F6F8FA',
    inputBorder: '#D0D7DE',

    // Status pills
    statusNew: '#0969DA',
    statusContacted: '#BF8700',
    statusQualified: '#1A7F37',
    statusProposed: '#8250DF',
    statusWon: '#1A7F37',
    statusLost: '#CF222E',

    // Shadows (iOS)
    shadow: 'rgba(31, 35, 40, 0.08)',

    // Tab bar icons
    tabIconDefault: '#8B949E',
    tabIconSelected: coral.primary,
  },
  dark: {
    // Backgrounds
    background: '#0D1117',
    surfacePrimary: '#161B22',
    surfaceSecondary: '#21262D',
    surfaceElevated: '#1C2129',

    // Text
    textPrimary: '#E6EDF3',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',
    textInverse: '#1F2328',

    // Accent
    accent: '#F0816F',
    accentLight: '#2D1A16',
    accentDark: coral.primary,
    accentMuted: '#7A3D33',

    // Semantic
    success: '#3FB950',
    successLight: '#12261E',
    warning: '#D29922',
    warningLight: '#272115',
    danger: '#F85149',
    dangerLight: '#2D1216',
    info: '#58A6FF',
    infoLight: '#12243B',

    // Borders & Dividers
    border: '#30363D',
    borderLight: '#21262D',
    divider: '#21262D',

    // Cards & Components
    cardBackground: '#161B22',
    cardBorder: '#30363D',
    tabBar: '#161B22',
    tabBarBorder: '#30363D',
    inputBackground: '#0D1117',
    inputBorder: '#30363D',

    // Status pills
    statusNew: '#58A6FF',
    statusContacted: '#D29922',
    statusQualified: '#3FB950',
    statusProposed: '#BC8CFF',
    statusWon: '#3FB950',
    statusLost: '#F85149',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Tab bar icons
    tabIconDefault: '#6E7681',
    tabIconSelected: '#F0816F',
  },
};
