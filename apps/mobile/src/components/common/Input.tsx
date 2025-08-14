import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: 'text' | 'phone' | 'otp';
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'text',
  error,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'otp':
        return {
          container: { gap: spacing[2] },
          input: { 
            textAlign: 'center' as const,
            fontSize: typography.fontSize.xl,
            fontWeight: '700' as const,
            letterSpacing: 2,
          },
        };
      default:
        return {
          container: { gap: spacing[2] },
          input: {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  const getInputContainerStyle = () => {
    if (disabled) return styles.inputContainerDisabled;
    if (error) return styles.inputContainerError;
    if (isFocused) return styles.inputContainerFocused;
    return styles.inputContainer;
  };

  return (
    <View style={[styles.container, variantStyles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[styles.inputContainer, getInputContainerStyle()]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            variantStyles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          selectTextOnFocus={variant === 'otp'}
          maxLength={variant === 'otp' ? 6 : undefined}
          keyboardType={variant === 'phone' ? 'phone-pad' : variant === 'otp' ? 'number-pad' : 'default'}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    ...shadows.sm,
  },
  inputContainerFocused: {
    borderColor: colors.gold[400],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    ...shadows.md,
  },
  inputContainerError: {
    borderColor: colors.error[500],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inputContainerDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    fontFamily: typography.fontFamily.regular,
    paddingVertical: spacing[1],
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  inputWithRightIcon: {
    marginRight: spacing[2],
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing[1],
  },
});
