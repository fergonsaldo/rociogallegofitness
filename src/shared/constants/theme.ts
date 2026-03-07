/**
 * Design tokens for FitCoach.
 * Single source of truth for colors, spacing and typography.
 *
 * Theme: Light — white backgrounds, #C90960 as brand primary.
 */

export const Colors = {
  // Brand
  primary: '#C90960',
  primaryLight: '#E81070',
  primaryDark: '#A00750',
  primarySubtle: '#FDF0F5',   // very light pink tint for backgrounds

  // Athlete accent (teal, contrasts well on white)
  athlete: '#0891B2',
  athleteLight: '#0EA5E9',
  athleteDark: '#0E7490',
  athleteSubtle: '#F0F9FF',

  // Neutrals — light theme
  background: '#F8F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F3F3F6',
  border: '#E5E5EE',
  borderLight: '#EFEFF5',

  // Text
  textPrimary: '#111118',
  textSecondary: '#6B6B80',
  textMuted: '#ABABBE',

  // Semantic
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',

  // Tab bar
  tabActive: '#C90960',
  tabInactive: '#ABABBE',
  tabBackground: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
