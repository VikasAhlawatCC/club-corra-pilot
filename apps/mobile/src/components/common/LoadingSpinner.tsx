import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'gold';
  text?: string;
  showText?: boolean;
  style?: any;
}

export function LoadingSpinner({
  size = 'medium',
  variant = 'primary',
  text = 'Loading...',
  showText = true,
  style,
}: LoadingSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for the inner circle
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    // Start animations
    spinAnimation.start();
    pulseAnimation.start();
    fadeAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [spinValue, pulseValue, fadeValue]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 40, height: 40 },
          spinner: { width: 32, height: 32, borderWidth: 2 },
          text: { fontSize: typography.fontSize.sm },
        };
      case 'large':
        return {
          container: { width: 80, height: 80 },
          spinner: { width: 64, height: 64, borderWidth: 4 },
          text: { fontSize: typography.fontSize.lg },
        };
      default: // medium
        return {
          container: { width: 60, height: 60 },
          spinner: { width: 48, height: 48, borderWidth: 3 },
          text: { fontSize: typography.fontSize.md },
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          spinner: { borderColor: colors.primary[400] },
          text: { color: colors.text.secondary },
        };
      case 'gold':
        return {
          spinner: { borderColor: colors.gold[400] },
          text: { color: colors.gold[400] },
        };
      default: // primary
        return {
          spinner: { borderColor: colors.primary[500] },
          text: { color: colors.text.primary },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        sizeStyles.container,
        { opacity: fadeValue },
        style,
      ]}
    >
      {/* Main spinner */}
      <Animated.View
        style={[
          styles.spinner,
          sizeStyles.spinner,
          variantStyles.spinner,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
      
      {/* Inner pulsing circle */}
      <Animated.View
        style={[
          styles.innerCircle,
          sizeStyles.spinner,
          {
            transform: [{ scale: pulseValue }],
            borderColor: variantStyles.spinner.borderColor,
            borderWidth: sizeStyles.spinner.borderWidth * 0.5,
          },
        ]}
      />
      
      {/* Loading text */}
      {showText && (
        <Animated.Text
          style={[
            styles.text,
            sizeStyles.text,
            variantStyles.text,
            { opacity: fadeValue },
          ]}
        >
          {text}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  spinner: {
    borderRadius: 999,
    borderStyle: 'solid',
    position: 'absolute',
  },
  innerCircle: {
    borderRadius: 999,
    borderStyle: 'solid',
    position: 'absolute',
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});
