import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { colors, typography } from '../../styles/theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'white' | 'accent' | 'error' | 'success';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semiBold' | 'bold';
}

export function Typography({
  children,
  variant = 'body1',
  color = 'primary',
  align = 'left',
  weight,
  style,
  ...props
}: TypographyProps) {
  const textStyle = [
    styles[variant],
    styles[color],
    styles[align],
    weight && styles[weight],
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
}

// Convenience components for common text styles
export function H1({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="h1" {...props}>{children}</Typography>;
}

export function H2({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="h2" {...props}>{children}</Typography>;
}

export function H3({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="h3" {...props}>{children}</Typography>;
}

export function Body1({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body1" {...props}>{children}</Typography>;
}

export function Body2({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body2" {...props}>{children}</Typography>;
}

export function Caption({ children, ...props }: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="caption" {...props}>{children}</Typography>;
}

const styles = StyleSheet.create({
  // Heading styles
  h1: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.display,
    fontWeight: '700', // Map 'bold' to '700'
    lineHeight: 36,
  },

  h2: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    fontWeight: '700', // Map 'bold' to '700'
    lineHeight: 32,
  },

  h3: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700', // Map 'bold' to '700'
    lineHeight: 28,
  },

  // Body text styles
  body1: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400', // Map 'normal' to '400'
    lineHeight: 24,
  },

  body2: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400', // Map 'normal' to '400'
    lineHeight: 20,
  },

  // Caption style
  caption: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400', // Map 'normal' to '400'
    lineHeight: 16,
  },

  // Color variants
  primary: {
    color: colors.text.primary,
  },

  secondary: {
    color: colors.text.secondary,
  },

  muted: {
    color: colors.text.muted,
  },

  white: {
    color: colors.text.white,
  },

  accent: {
    color: colors.text.accent,
  },

  error: {
    color: colors.error[500],
  },

  success: {
    color: colors.success[500],
  },

  // Alignment variants
  left: {
    textAlign: 'left',
  },

  center: {
    textAlign: 'center',
  },

  right: {
    textAlign: 'right',
  },

  // Weight variants
  normal: {
    fontWeight: '400', // Map 'normal' to '400'
  },

  medium: {
    fontWeight: '500', // Map 'medium' to '500'
  },

  semiBold: {
    fontWeight: '600', // Map 'semiBold' to '600'
  },

  bold: {
    fontWeight: '700', // Map 'bold' to '700'
  },
});
