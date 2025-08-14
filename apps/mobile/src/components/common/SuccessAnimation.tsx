import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

interface SuccessAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'gold' | 'success';
  onAnimationComplete?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  style?: any;
}

export function SuccessAnimation({
  message = 'Success!',
  size = 'medium',
  variant = 'success',
  onAnimationComplete,
  autoHide = false,
  autoHideDelay = 2000,
  style,
}: SuccessAnimationProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animation sequence
    const animationSequence = Animated.sequence([
      // Initial scale and fade in
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Checkmark animation
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
      // Message fade in
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });

    // Auto-hide functionality
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, autoHideDelay);

      return () => clearTimeout(hideTimer);
    }
  }, [scaleValue, opacityValue, checkmarkScale, messageOpacity, onAnimationComplete, autoHide, autoHideDelay]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 80, height: 80 },
          icon: { fontSize: 32 },
          message: { fontSize: typography.fontSize.sm },
        };
      case 'large':
        return {
          container: { width: 120, height: 120 },
          icon: { fontSize: 48 },
          message: { fontSize: typography.fontSize.lg },
        };
      default: // medium
        return {
          container: { width: 100, height: 100 },
          icon: { fontSize: 40 },
          message: { fontSize: typography.fontSize.md },
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.primary[500],
          icon: colors.background.primary,
          message: colors.text.primary,
        };
      case 'gold':
        return {
          background: colors.gold[400],
          icon: colors.background.dark[900],
          message: colors.gold[400],
        };
      default: // success
        return {
          background: colors.success[500],
          icon: colors.background.primary,
          message: colors.text.primary,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        {
          opacity: opacityValue,
          transform: [{ scale: scaleValue }],
        },
        style,
      ]}
    >
      {/* Success circle background */}
      <View
        style={[
          styles.backgroundCircle,
          sizeStyles.container,
          {
            backgroundColor: variantStyles.background,
            borderRadius: sizeStyles.container.width / 2,
          },
        ]}
      />
      
      {/* Checkmark icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: checkmarkScale }],
          },
        ]}
      >
        <Ionicons
          name="checkmark"
          size={sizeStyles.icon.fontSize}
          color={variantStyles.icon}
        />
      </Animated.View>
      
      {/* Success message */}
      {message && (
        <Animated.Text
          style={[
            styles.message,
            sizeStyles.message,
            {
              color: variantStyles.message,
              opacity: messageOpacity,
            },
          ]}
        >
          {message}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    ...shadows.lg,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: spacing[4],
    fontWeight: '600',
  },
});
