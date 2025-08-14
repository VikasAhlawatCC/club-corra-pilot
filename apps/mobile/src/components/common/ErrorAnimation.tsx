import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

interface ErrorAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'error' | 'warning' | 'danger';
  onAnimationComplete?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  style?: any;
}

export function ErrorAnimation({
  message = 'Error occurred',
  size = 'medium',
  variant = 'error',
  onAnimationComplete,
  autoHide = false,
  autoHideDelay = 3000,
  style,
}: ErrorAnimationProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const shakeValue = useRef(new Animated.Value(0)).current;

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
      // Icon animation with shake effect
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeValue, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: -1,
            duration: 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
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
  }, [scaleValue, opacityValue, iconScale, messageOpacity, shakeValue, onAnimationComplete, autoHide, autoHideDelay]);

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
      case 'warning':
        return {
          background: colors.warning[500],
          icon: colors.background.primary,
          message: colors.text.primary,
        };
      case 'danger':
        return {
          background: '#DC2626', // Darker red
          icon: colors.background.primary,
          message: colors.text.primary,
        };
      default: // error
        return {
          background: colors.error[500],
          icon: colors.background.primary,
          message: colors.text.primary,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const shakeTransform = shakeValue.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

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
      {/* Error circle background */}
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
      
      {/* Error icon with shake effect */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: iconScale },
              { rotate: shakeTransform },
            ],
          },
        ]}
      >
        <Ionicons
          name="close-circle"
          size={sizeStyles.icon.fontSize}
          color={variantStyles.icon}
        />
      </Animated.View>
      
      {/* Error message */}
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
