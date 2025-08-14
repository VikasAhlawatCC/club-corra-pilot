import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/styles/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  dismissible?: boolean;
}

export default function ErrorMessage({
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  showIcon = true,
  dismissible = false,
}: ErrorMessageProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: colors.warning[100],
          borderColor: colors.warning[500],
          iconColor: colors.warning[600],
          textColor: colors.warning[800],
        };
      case 'info':
        return {
          backgroundColor: colors.primary[100],
          borderColor: colors.primary[500],
          iconColor: colors.primary[600],
          textColor: colors.primary[800],
        };
      default:
        return {
          backgroundColor: colors.error[100],
          borderColor: colors.error[500],
          iconColor: colors.error[600],
          textColor: colors.error[800],
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, { backgroundColor: variantStyles.backgroundColor, borderColor: variantStyles.borderColor }]}>
      <View style={styles.content}>
        {showIcon && (
          <Ionicons
            name={variant === 'error' ? 'alert-circle' : variant === 'warning' ? 'warning' : 'information-circle'}
            size={20}
            color={variantStyles.iconColor}
            style={styles.icon}
          />
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: variantStyles.textColor }]}>
            {message}
          </Text>
        </View>

        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: variantStyles.borderColor }]}
              onPress={onRetry}
            >
              <Ionicons name="refresh" size={16} color={colors.white} />
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          {dismissible && onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={variantStyles.iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginVertical: spacing[3],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: spacing[3],
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing[3],
  },
  message: {
    ...typography.body,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
    gap: spacing[1],
  },
  actionButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  dismissButton: {
    padding: spacing[1],
    borderRadius: borderRadius.full,
  },
});
