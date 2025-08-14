import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  StyleProp
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'white';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle
}: ButtonProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderRadius: borderRadius.lg,
          },
          text: { fontSize: typography.fontSize.sm },
        };
      case 'large':
        return {
          container: {
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: borderRadius.xl,
          },
          text: { fontSize: typography.fontSize.lg },
        };
      default: // medium
        return {
          container: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderRadius: borderRadius.lg,
          },
          text: { fontSize: typography.fontSize.md },
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.gold[800],
            ...shadows.md,
          },
          text: { color: colors.background.dark[900] },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.gold[800],
            ...shadows.sm,
          },
          text: { color: colors.gold[800] },
        };
      case 'glass':
        return {
          container: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            ...shadows.soft,
          },
          text: { color: colors.text.white },
        };
      case 'white':
        return {
          container: {
            backgroundColor: colors.text.white,
            ...shadows.md,
          },
          text: { color: colors.background.dark[900] },
        };
      default:
        return {
          container: {
            backgroundColor: colors.gold[800],
            ...shadows.md,
          },
          text: { color: colors.background.dark[900] },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variantStyles.text.color}
          />
          <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
            Loading...
          </Text>
        </View>
      ) : (
        <Text style={[styles.text, sizeStyles.text, variantStyles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48, // Minimum touch target
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    textAlign: 'center',
  },
});
