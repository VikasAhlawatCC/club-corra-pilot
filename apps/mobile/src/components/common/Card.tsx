import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: keyof typeof spacing;
  margin?: keyof typeof spacing;
  style?: ViewStyle;
}

export function Card({ 
  children, 
  variant = 'default', 
  padding = 4,
  margin,
  style 
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card.secondary,
          ...shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.card.border,
          ...shadows.sm,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          ...shadows.soft,
        };
      default:
        return {
          backgroundColor: colors.card.primary,
          ...shadows.md,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.base,
        variantStyles,
        { padding: spacing[padding] },
        margin !== undefined && { margin: spacing[margin] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
});
