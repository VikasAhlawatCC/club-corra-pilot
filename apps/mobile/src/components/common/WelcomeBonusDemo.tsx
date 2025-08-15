import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WelcomeBonusAnimation } from './WelcomeBonusAnimation';
import { colors, spacing, borderRadius, typography, shadows } from '@/styles/theme';

export const WelcomeBonusDemo: React.FC = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);

  const handleStartAnimation = () => {
    setShowAnimation(true);
    setAnimationCount(prev => prev + 1);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  const handleReset = () => {
    setAnimationCount(0);
    setShowAnimation(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Bonus Animation Demo</Text>
      <Text style={styles.subtitle}>
        Test the slot machine-like coin animation
      </Text>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          Animations Played: {animationCount}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStartAnimation}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>🎬 Play Animation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>🔄 Reset Counter</Text>
        </TouchableOpacity>
      </View>

      {showAnimation && (
        <View style={styles.animationContainer}>
          <WelcomeBonusAnimation
            isVisible={showAnimation}
            onAnimationComplete={handleAnimationComplete}
          />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>• Coin counter from 0 to 100</Text>
        <Text style={styles.infoText}>• Bouncing coin animation</Text>
        <Text style={styles.infoText}>• Graffiti style text</Text>
        <Text style={styles.infoText}>• Confetti explosion</Text>
        <Text style={styles.infoText}>• Celebration icons</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[6],
    backgroundColor: colors.background.dark[900],
    alignItems: 'center',
  },
  
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  
  stats: {
    backgroundColor: colors.background.dark[800],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  
  statText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  
  resetButton: {
    backgroundColor: colors.gold[600],
  },
  
  buttonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  
  animationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  info: {
    backgroundColor: colors.background.dark[800],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[400],
    alignSelf: 'stretch',
  },
  
  infoTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  
  infoText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[1],
  },
});

