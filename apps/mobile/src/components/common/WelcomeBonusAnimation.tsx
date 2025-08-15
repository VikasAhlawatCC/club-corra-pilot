import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeBonusAnimationProps {
  onAnimationComplete?: () => void;
  isVisible?: boolean;
}

export const WelcomeBonusAnimation: React.FC<WelcomeBonusAnimationProps> = ({
  onAnimationComplete,
  isVisible = true,
}) => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation values
  const coinScaleAnim = useRef(new Animated.Value(0)).current;
  const coinBounceAnim = useRef(new Animated.Value(0)).current;
  const textGlowAnim = useRef(new Animated.Value(0)).current;
  const graffitiScaleAnim = useRef(new Animated.Value(0.5)).current;
  const graffitiRotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  // Confetti positions
  const confettiPositions = useRef([
    { x: new Animated.Value(-50), y: new Animated.Value(-50) },
    { x: new Animated.Value(-30), y: new Animated.Value(-80) },
    { x: new Animated.Value(20), y: new Animated.Value(-60) },
    { x: new Animated.Value(40), y: new Animated.Value(-90) },
    { x: new Animated.Value(-60), y: new Animated.Value(-40) },
    { x: new Animated.Value(50), y: new Animated.Value(-70) },
  ]).current;

  useEffect(() => {
    if (isVisible && !isAnimating) {
      startAnimation();
    }
  }, [isVisible]);

  const startAnimation = () => {
    setIsAnimating(true);
    
    // Reset values
    setCurrentAmount(0);
    coinScaleAnim.setValue(0);
    coinBounceAnim.setValue(0);
    textGlowAnim.setValue(0);
    graffitiScaleAnim.setValue(0.5);
    graffitiRotateAnim.setValue(0);
    confettiAnim.setValue(0);
    
    // Animate coin appearance
    const coinAnimation = Animated.sequence([
      Animated.spring(coinScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(coinBounceAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.timing(coinBounceAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]);

    // Animate text glow
    const textAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(textGlowAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textGlowAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Animate graffiti text
    const graffitiAnimation = Animated.sequence([
      Animated.spring(graffitiScaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.loop(
        Animated.timing(graffitiRotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]);

    // Animate confetti
    const confettiAnimation = Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    });

    // Start all animations
    Animated.parallel([
      coinAnimation,
      textAnimation,
      graffitiAnimation,
      confettiAnimation,
    ]).start();

    // Animate coin count from 0 to 100
    let counter = 0;
    const countInterval = setInterval(() => {
      counter += Math.floor(Math.random() * 5) + 1;
      if (counter >= 100) {
        counter = 100;
        clearInterval(countInterval);
        
        // Wait a bit then call completion
        setTimeout(() => {
          setIsAnimating(false);
          onAnimationComplete?.();
        }, 1000);
      }
      setCurrentAmount(counter);
    }, 50);
  };

  const coinAnimatedStyle = {
    transform: [
      { scale: coinScaleAnim },
      {
        translateY: coinBounceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  };

  const textGlowStyle = {
    shadowOpacity: textGlowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
    shadowRadius: textGlowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 20],
    }),
  };

  const graffitiAnimatedStyle = {
    transform: [
      { scale: graffitiScaleAnim },
      {
        rotate: graffitiRotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '5deg'],
        }),
      },
    ],
  };

  const confettiAnimatedStyles = confettiPositions.map((pos, index) => ({
    transform: [
      {
        translateX: pos.x.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (index % 2 === 0 ? 1 : -1) * (Math.random() * 100 + 50)],
        }),
      },
      {
        translateY: pos.y.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -200 - Math.random() * 100],
        }),
      },
      {
        rotate: confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 + Math.random() * 180}deg`],
        }),
      },
    ],
    opacity: confettiAnim.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0, 1, 0],
    }),
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Confetti */}
      {confettiPositions.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              backgroundColor: [
                colors.gold[500],
                colors.primary[500],
                colors.gold[700],
                colors.primary[600],
              ][index % 4],
            },
            confettiAnimatedStyles[index] as any,
          ]}
        />
      ))}

      {/* Main Coin Display */}
      <Animated.View style={[styles.coinContainer, coinAnimatedStyle as any]}>
        <View style={styles.coinIcon}>
          <Ionicons name="business" size={48} color={colors.text.dark} />
        </View>
        <Animated.Text style={[styles.coinAmount, textGlowStyle as any]}>
          {currentAmount}
        </Animated.Text>
        <Text style={styles.coinLabel}>Corra Coins</Text>
      </Animated.View>

      {/* Graffiti Style Welcome Bonus Text */}
      <Animated.View style={[styles.graffitiContainer, graffitiAnimatedStyle as any]}>
        <Text style={styles.graffitiText}>🎉 WELCOME BONUS! 🎉</Text>
        <Text style={styles.graffitiSubtext}>100 COINS ADDED!</Text>
      </Animated.View>

      {/* Celebration Icons */}
      <View style={styles.celebrationIcons}>
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              transform: [
                {
                  scale: textGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            } as any,
          ]}
        >
          <Ionicons name="star" size={24} color={colors.gold[500]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              transform: [
                {
                  scale: textGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            } as any,
          ]}
        >
          <Ionicons name="sparkles" size={24} color={colors.primary[500]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.celebrationIcon,
            {
              transform: [
                {
                  scale: textGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            } as any,
          ]}
        >
          <Ionicons name="gift" size={24} color={colors.gold[700]} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    position: 'relative',
  },
  
  // Confetti styles
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  
  // Coin container styles
  coinContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    zIndex: 2,
  },
  
  coinIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    borderWidth: 3,
    borderColor: colors.text.dark,
    ...shadows.gold,
  },
  
  coinAmount: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.gold,
    marginBottom: spacing[1],
    textAlign: 'center',
    ...shadows.gold,
  },
  
  coinLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  // Graffiti text styles
  graffitiContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    zIndex: 2,
  },
  
  graffitiText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
    textShadowColor: colors.gold[500],
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    transform: [{ skewX: '-5deg' }],
  },
  
  graffitiSubtext: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.gold[500],
    textAlign: 'center',
    textShadowColor: colors.primary[500],
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    transform: [{ skewX: '3deg' }],
  },
  
  // Celebration icons
  celebrationIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
    zIndex: 2,
  },
  
  celebrationIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.dark[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[400],
    ...shadows.md,
  },
});
