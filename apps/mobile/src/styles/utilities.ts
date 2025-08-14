// Club Corra Mobile App - Simplified Utility System (Prototype Focus)

import { colors, spacing, borderRadius, shadows } from './theme';

// Layout Utilities
export const layoutUtils = {
  flex: { flex: 1 },
  flexRow: { flexDirection: 'row' as const },
  flexCol: { flexDirection: 'column' as const },
  itemsCenter: { alignItems: 'center' as const },
  itemsStart: { alignItems: 'flex-start' as const },
  itemsEnd: { alignItems: 'flex-end' as const },
  justifyCenter: { justifyContent: 'center' as const },
  justifyBetween: { justifyContent: 'space-between' as const },
  justifyStart: { justifyContent: 'flex-start' as const },
  justifyEnd: { justifyContent: 'flex-end' as const },
  absolute: { position: 'absolute' as const },
  relative: { position: 'relative' as const },
  top0: { top: 0 },
  right0: { right: 0 },
  bottom0: { bottom: 0 },
  left0: { left: 0 },
};

// Spacing Utilities
export const spacingUtils = {
  // Padding
  p0: { padding: spacing[0] },
  p2: { padding: spacing[2] },
  p4: { padding: spacing[4] },
  p6: { padding: spacing[6] },
  p8: { padding: spacing[8] },
  px4: { paddingHorizontal: spacing[4] },
  px6: { paddingHorizontal: spacing[6] },
  px8: { paddingHorizontal: spacing[8] },
  py4: { paddingVertical: spacing[4] },
  py6: { paddingVertical: spacing[6] },
  py8: { paddingVertical: spacing[8] },
  pt4: { paddingTop: spacing[4] },
  pt6: { paddingTop: spacing[6] },
  pt8: { paddingTop: spacing[8] },
  pb4: { paddingBottom: spacing[4] },
  pb6: { paddingBottom: spacing[6] },
  pb8: { paddingBottom: spacing[8] },
  pl4: { paddingLeft: spacing[4] },
  pr4: { paddingRight: spacing[4] },

  // Margin
  m0: { margin: spacing[0] },
  m2: { margin: spacing[2] },
  m4: { margin: spacing[4] },
  m6: { margin: spacing[6] },
  m8: { margin: spacing[8] },
  mx4: { marginHorizontal: spacing[4] },
  mx6: { marginHorizontal: spacing[6] },
  mx8: { marginHorizontal: spacing[8] },
  my4: { marginVertical: spacing[4] },
  my6: { marginVertical: spacing[6] },
  my8: { marginVertical: spacing[8] },
  mt4: { marginTop: spacing[4] },
  mt6: { marginTop: spacing[6] },
  mt8: { marginTop: spacing[8] },
  mb4: { marginBottom: spacing[4] },
  mb6: { marginBottom: spacing[6] },
  mb8: { marginBottom: spacing[8] },
  ml4: { marginLeft: spacing[4] },
  mr4: { marginRight: spacing[4] },
};

// Text Utilities (Simplified for prototype)
export const textUtils = {
  // Text colors only
  textPrimary: { color: colors.text.primary },
  textSecondary: { color: colors.text.secondary },
  textMuted: { color: colors.text.muted },
  textWhite: { color: colors.text.white },
  textAccent: { color: colors.text.accent },
};

// Background Utilities
export const backgroundUtils = {
  bgPrimary: { backgroundColor: colors.background.primary },
  bgSecondary: { backgroundColor: colors.background.secondary },
  bgDark800: { backgroundColor: colors.background.dark[800] },
  bgDark900: { backgroundColor: colors.background.dark[900] },
  bgPrimary500: { backgroundColor: colors.primary[500] },
  bgSuccess500: { backgroundColor: colors.success[500] },
  bgWarning500: { backgroundColor: colors.warning[500] },
  bgError500: { backgroundColor: colors.error[500] },
  bgGlass: { backgroundColor: colors.background.glass },
};

// Border Utilities
export const borderUtils = {
  // Border radius
  roundedNone: { borderRadius: borderRadius.none },
  roundedSm: { borderRadius: borderRadius.sm },
  roundedBase: { borderRadius: borderRadius.base },
  roundedMd: { borderRadius: borderRadius.md },
  roundedLg: { borderRadius: borderRadius.lg },
  roundedXl: { borderRadius: borderRadius.xl },
  rounded2xl: { borderRadius: borderRadius['2xl'] },
  rounded3xl: { borderRadius: borderRadius['3xl'] },
  roundedFull: { borderRadius: borderRadius.full },

  // Border width
  border0: { borderWidth: 0 },
  border: { borderWidth: 1 },
  border2: { borderWidth: 2 },
  border4: { borderWidth: 4 },

  // Border colors
  borderLight: { borderColor: colors.neutral[100] },
  borderPrimary: { borderColor: colors.primary[500] },
  borderError: { borderColor: colors.error[500] },
};

// Size Utilities
export const sizeUtils = {
  // Width
  wFull: { width: '100%' },
  w0: { width: 0 },
  w4: { width: spacing[4] },
  w8: { width: spacing[8] },
  w16: { width: spacing[16] },
  w24: { width: 96 },

  // Height
  hFull: { height: '100%' },
  h0: { height: 0 },
  h4: { height: spacing[4] },
  h8: { height: spacing[8] },
  h16: { height: spacing[16] },
  h24: { height: 96 },
};

// Shadow Utilities
export const shadowUtils = {
  shadowSm: shadows.sm,
  shadowMd: shadows.md,
  shadowLg: shadows.lg,
};

// Common Style Combinations (Simplified for prototype)
export const commonStyles = {
  // Card styles
  card: {
    ...backgroundUtils.bgPrimary,
    borderRadius: borderRadius.lg,
    ...shadowUtils.shadowMd,
    ...spacingUtils.p6,
  },

  // Container styles
  container: {
    ...spacingUtils.p4,
    ...backgroundUtils.bgPrimary,
  },
};

// Utility Functions
export const combineStyles = (...styles: any[]) => {
  return styles.reduce((combined, style) => ({ ...combined, ...style }), {});
};

export const conditionalStyle = (condition: boolean, trueStyle: any, falseStyle: any) => {
  return condition ? trueStyle : falseStyle;
};

// Export all utilities
export default {
  layoutUtils,
  spacingUtils,
  textUtils,
  backgroundUtils,
  borderUtils,
  sizeUtils,
  shadowUtils,
  commonStyles,
  combineStyles,
  conditionalStyle,
};
