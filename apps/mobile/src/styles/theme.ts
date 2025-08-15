// Club Corra Mobile App - Premium Elite Design System

export const colors = {
  // Primary Colors (Elite Blue)
  primary: {
    50: '#F0F9FF',   // Extra light blue
    100: '#E0F2FE',  // Very light blue
    400: '#38BDF8',  // Medium blue
    500: '#0EA5E9',  // Primary blue
    600: '#0284C7',  // Medium dark blue
    800: '#075985',  // Very dark blue
  },

  // Premium Gold Accents (Elite Gold)
  gold: {
    100: '#F7E7A9',  // Very light gold
    300: '#E3C565',  // Light gold
    400: '#D4AF37',  // Primary gold
    500: '#B68B2A',  // Medium gold
    600: '#694D0F',  // Dark gold
    700: '#F4E4A6',  // Bright gold for highlights
    800: '#C4A484',  // Muted gold for buttons (better contrast)
  },

  // Semantic colors
  success: { 
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22C55E',
    600: '#16a34a',
    700: '#15803d'
  },    // Green
  warning: { 
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#F59E0B',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e'
  },    // Amber
  error: { 
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#EF4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b'
  },      // Red
  
  neutral: {
    50: '#fafafa',
    100: '#F5F5F5',
    200: '#e5e7eb',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background colors (Elite Dark Theme)
  background: {
    primary: '#FFFFFF',      // Pure white
    secondary: '#F8FAFC',    // Light gray
    dark: {
      800: '#1A1D21',        // Elite dark gray
      900: '#0F1419',        // Elite deep black
    },
    light: {
      50: '#F8FAFC',         // Very light background
      100: '#F1F5F9',        // Light background
    },
    glass: 'rgba(255, 255, 255, 0.15)',  // Enhanced glassmorphism
    glassDark: 'rgba(0, 0, 0, 0.4)',     // Enhanced dark glass
    whiteGlass: 'rgba(255, 255, 255, 0.08)', // Enhanced white glass
    card: '#1E2328',         // Elite card background
    input: '#2A2F36',        // Elite input background
  },

  // Text colors (High Contrast for Elite Feel)
  text: {
    primary: '#FFFFFF',      // Pure white text
    secondary: '#E5E7EB',    // Light gray text (high contrast)
    muted: '#D1D5DB',        // Muted text (still visible)
    white: '#FFFFFF',        // White text
    accent: '#F4E4A6',       // Bright gold text
    gold: '#F4E4A6',         // Bright gold accent
    dark: '#1F2937',         // Dark text for light backgrounds
    input: '#FFFFFF',        // Input text color
    placeholder: '#9CA3AF',  // Placeholder text
  },

  // Card colors (Elite Premium)
  card: {
    primary: '#1E2328',      // Elite card background
    secondary: '#2A2F36',    // Elite secondary card
    glass: 'rgba(255, 255, 255, 0.08)', // Premium glass effect
    border: 'rgba(255, 255, 255, 0.15)', // Enhanced border color
    elevated: '#252A30',     // Elevated card background
  },

  // Input colors (Elite Styling)
  input: {
    background: '#2A2F36',   // Elite input background
    border: '#3B4148',       // Elite input border
    focus: '#0EA5E9',        // Focus border color
    placeholder: '#9CA3AF',  // Placeholder text color
  },

  // Additional colors needed by components
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
  },
  // Border colors
  border: {
    primary: '#3B4148',
    input: '#3B4148',
    focused: '#0EA5E9',
  },
};

export const typography = {
  // Primary fonts (Elite Typography)
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    display: 'Poppins-Bold',
    serif: 'ui-serif, Georgia, serif', // For logo text
  },

  // Font scale (Elite Sizing)
  fontSize: {
    xs: 10,       // Extra small (10px)
    sm: 11,       // Small (11px)
    base: 12,     // Base (12px)
    md: 14,       // Medium (14px)
    lg: 16,       // Large (16px)
    xl: 18,       // Extra large (18px)
    '2xl': 20,    // 2X large (20px)
    '3xl': 24,    // 3X large (24px)
    '4xl': 30,    // 4X large (30px)
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Typography variants for consistent text styling
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyLarge: { fontSize: 18, fontWeight: '400' as const, lineHeight: 28 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  heading: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  headingLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  headingMedium: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  headingSmall: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

// Spacing system (Elite Spacing)
export const spacing = {
  0: 0,        // 0px
  1: 4,        // 4px
  2: 8,        // 8px
  3: 12,       // 12px
  4: 16,       // 16px
  5: 20,       // 20px
  6: 24,       // 24px
  8: 32,       // 32px
  10: 40,      // 40px
  12: 48,      // 48px
  16: 64,      // 64px
  20: 80,      // 80px
  24: 96,      // 96px
  // Additional spacing values for components
  xs: 4,       // 4px
  sm: 8,       // 8px
  md: 16,      // 16px
  lg: 24,      // 24px
};

// Border radius system (Elite Styling)
export const borderRadius = {
  none: 0,
  sm: 4,       // Small elements
  base: 6,     // Default
  md: 8,       // Medium elements
  lg: 12,      // Cards, buttons
  xl: 16,      // Large cards
  '2xl': 24,   // Hero sections
  '3xl': 32,   // Very large elements
  full: 9999,  // Circular elements
  // Additional values for components
  xs: 4,       // Extra small
};

// Shadow system (Elite Premium Shadows)
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  // Premium gold glow
  gold: {
    shadowColor: '#F4E4A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  // Elevated shadow for cards
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  // Card shadow
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  // Glass shadow
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 35,
    elevation: 15,
  },
  // Soft shadow
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
};

  // Animation timing (Elite Smooth)
export const animation = {
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  duration: {
    fast: 200,      // Quick feedback
    normal: 300,    // Standard transitions
    slow: 500,      // Complex animations
    celebration: 900, // Celebration animations
  },
  // Spring physics constants for consistent animations
  spring: {
    logo: { tension: 100, friction: 8 },
    content: { tension: 80, friction: 8 },
    card: { tension: 120, friction: 8 },
    input: { tension: 100, friction: 8 },
    button: { tension: 120, friction: 8 },
  },
  // Timing constants for consistent animations
  timing: {
    fade: { duration: 500, easing: 'ease' },
    slide: { duration: 600, easing: 'ease' },
    scale: { duration: 300, easing: 'ease' },
    entrance: { duration: 800, easing: 'ease' },
  },
};

// Glassmorphism effects (Elite Premium) - Renamed to avoid conflict
export const glassEffects = {
  primary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px)',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px)',
  },
  white: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px)',
  },
  card: {
    backgroundColor: 'rgba(30, 35, 40, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px)',
  },
  // Additional glass effects for components
  input: {
    backgroundColor: 'rgba(42, 47, 54, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(59, 65, 72, 0.8)',
    backdropFilter: 'blur(20px)',
  },
};

// Export all design tokens
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  glassEffects,
};
