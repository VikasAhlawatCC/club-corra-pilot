import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface AnimationConfig {
  fadeIn?: boolean;
  slideUp?: boolean;
  scaleIn?: boolean;
  duration?: number;
  delay?: number;
}

export const useScreenAnimation = (config: AnimationConfig = {}) => {
  const {
    fadeIn = true,
    slideUp = false,
    scaleIn = false,
    duration = 600,
    delay = 0,
  } = config;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    if (fadeIn) {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        })
      );
    }

    if (slideUp) {
      animations.push(
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      );
    }

    if (scaleIn) {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      );
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }, [fadeIn, slideUp, scaleIn, duration, delay]);

  const getAnimatedStyle = () => {
    const style: any = {};

    if (fadeIn) {
      style.opacity = fadeAnim;
    }

    if (slideUp || scaleIn) {
      style.transform = [];
      
      if (slideUp) {
        style.transform.push({ translateY: slideAnim });
      }
      
      if (scaleIn) {
        style.transform.push({ scale: scaleAnim });
      }
    }

    return style;
  };

  const triggerSuccessAnimation = () => {
    return Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]);
  };

  const triggerErrorAnimation = () => {
    return Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
  };

  return {
    getAnimatedStyle,
    triggerSuccessAnimation,
    triggerErrorAnimation,
    fadeAnim,
    slideAnim,
    scaleAnim,
  };
};
