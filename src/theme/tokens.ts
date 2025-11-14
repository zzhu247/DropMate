export const colors = {
  // Primary - Neutral/Beige palette from new design
  primaryBeige: '#F5F1EB',
  primaryCream: '#FFF9F0',
  primaryBrown: '#8B5A3C',
  
  // Package colors for illustrations
  packageOrange: '#FFBE5C',
  packageLight: '#FFD88F',
  packageDark: '#8B5A3C',
  
  // Background & Surface
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  
  // Card backgrounds (for alternating colors)
  cardBackgroundYellow: '#FFF4E6',
  cardBackgroundBlue: '#E6F7FF',
  cardBackgroundGreen: '#daf0daff', // For delivered packages
  cardBackgroundRed: '#ffe6ebff',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textMuted: '#CCCCCC',
  
  // Status colors
  statusInTransit: '#000000',
  statusOutForDelivery: '#FF9500',
  statusDelivered: '#34C759',
  statusException: '#FF3B30',
  statusCreated: '#8E8E93',
  
  // Accent & Actions
  accent: '#00C2FF',
  accentLight: '#E5F7FF',
  
  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  
  // Borders & Dividers
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',
  
  // Overlays & Shadows
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.12)',
  
  // Interactive states
  pressed: 'rgba(0, 0, 0, 0.05)',
  hover: 'rgba(0, 0, 0, 0.03)',
  disabled: '#E5E5E5',
  
  // Timeline
  timelineActive: '#000000',
  timelineInactive: '#E8E8E8',
  timelineDot: '#000000',
};

export const gradients = {
  // Subtle gradients for backgrounds
  surface: {
    start: '#FFFFFF',
    end: '#FAFAFA',
  },
  beige: {
    start: '#FFF9F0',
    end: '#F5F1EB',
  },
  package: {
    start: '#FFD88F',
    end: '#FFBE5C',
  },
};

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
  // Specific component radii
  card: 20,
  button: 12,
  badge: 12,
  input: 12,
};

export const typography = {
  // Headings
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, fontFamily: 'Inter-Bold' },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, fontFamily: 'Inter-Bold' },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const, fontFamily: 'Inter-Bold' },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  
  // Body text
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const, fontFamily: 'Inter-Medium' },
  bodySemibold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  
  // Small text
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  smallMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, fontFamily: 'Inter-Medium' },
  smallSemibold: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  
  // Caption/Labels
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
  captionMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: 'Inter-Medium' },
  captionSemibold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  
  // Specialized
  trackingNumber: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, fontFamily: 'Inter-Bold' },
  badge: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  button: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const animations = {
  // Timing
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 350,
  
  // Easing (for use with Animated API)
  easeInOut: 'ease-in-out',
  easeOut: 'ease-out',
  easeIn: 'ease-in',
};

export type ThemeTokens = {
  colors: typeof colors;
  gradients: typeof gradients;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: typeof shadows;
  animations: typeof animations;
};

export const tokens: ThemeTokens = {
  colors,
  gradients,
  spacing,
  radii,
  typography,
  shadows,
  animations,
};