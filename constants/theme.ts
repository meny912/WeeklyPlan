export const Colors = {
  // Deep ink and antique gold – matches the app icon
  background: '#121624',
  surface: '#1A1F30',
  surfaceElevated: '#222839',
  border: '#2B3247',
  primary: '#C9A55C',
  primaryLight: '#E6CB8C',
  primaryDim: 'rgba(201,165,92,0.14)',
  text: '#F2EDE4',
  textSecondary: '#A9A49A',
  textMuted: '#6E7182',
  success: '#7FAE95',
  successDim: 'rgba(127,174,149,0.15)',
  danger: '#D07A7A',
  dangerDim: 'rgba(208,122,122,0.15)',
  white: '#FFFFFF',
};

/** Hebrew serif (Frank Ruhl Libre) for titles; body text stays in the system font. */
export const Fonts = {
  serif: 'FrankRuhlLibre_700Bold',
  serifMedium: 'FrankRuhlLibre_500Medium',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
