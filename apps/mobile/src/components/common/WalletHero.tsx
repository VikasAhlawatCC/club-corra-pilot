import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

interface WalletHeroProps {
  coins: number;
  celebrate?: {
    key: number;
    type: 'earn' | 'redeem';
  } | null;
}

export function WalletHero({ coins, celebrate }: WalletHeroProps) {
  const spinAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0.2)).current;
  const shineAnimation = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (celebrate?.key) {
      // Reset animations
      spinAnimation.setValue(0);
      scaleAnimation.setValue(1);
      glowAnimation.setValue(0.2);
      shineAnimation.setValue(-60);

      // Start celebration animations
      Animated.parallel([
        Animated.timing(spinAnimation, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.06,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 0.5,
            duration: 450,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0.2,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(shineAnimation, {
          toValue: 140,
          duration: 900,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [celebrate?.key]);

  const spinInterpolate = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const direction = celebrate?.type === 'redeem' ? 'down' : 'up';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Coin Container with 3D Perspective */}
        <View style={styles.coinContainer}>
          {/* Glow Ring Behind */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnimation,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          />

          {/* Animated Coin */}
          <Animated.View
            style={[
              styles.coin,
              {
                transform: [
                  { rotateY: spinInterpolate },
                  { scale: scaleAnimation },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.gold[100], colors.gold[300], colors.gold[500]]}
              style={styles.coinGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Coin Edge */}
              <View style={styles.coinEdge} />
              
              {/* Coin Center */}
              <View style={styles.coinCenter}>
                <Text style={styles.coinText}>CC</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Shine Effect */}
          <Animated.View
            style={[
              styles.shineContainer,
              {
                opacity: celebrate?.key ? 1 : 0,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.shine,
                {
                  transform: [{ translateX: shineAnimation }],
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Coin Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {coins.toLocaleString()}
          </Text>
          <Text style={styles.amountLabel}>Available balance</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.card.border,
    padding: spacing[6],
    marginBottom: spacing[4],
    ...shadows.glass,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinContainer: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  glowRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 56,
    backgroundColor: `rgba(212, 175, 55, 0.25)`,
  },
  coin: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEdge: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 56,
    borderWidth: 3,
    borderColor: colors.gold[600],
  },
  coinCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.gold[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: '800',
    color: colors.gold[600],
    textAlign: 'center',
  },
  shineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 56,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '-10deg' }],
  },
  amountContainer: {
    alignItems: 'center',
  },
  amount: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '700',
    color: colors.text.accent,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  amountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
});
