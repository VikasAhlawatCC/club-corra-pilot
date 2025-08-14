import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/styles/theme';
import { Card } from './Card';

interface WelcomeBonusPopupProps {
  visible: boolean;
  onClose: () => void;
  coinsAwarded?: number;
}

export const WelcomeBonusPopup: React.FC<WelcomeBonusPopupProps> = ({
  visible,
  onClose,
  coinsAwarded = 100,
}) => {
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleValue, opacityValue]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityValue,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary[500], colors.primary[600]]}
            style={styles.gradient}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text.white} />
            </TouchableOpacity>

            {/* Celebration icon */}
            <View style={styles.celebrationIcon}>
              <Ionicons name="gift" size={48} color={colors.text.white} />
            </View>

            {/* Title */}
            <Text style={styles.title}>🎉 Welcome to Club Corra!</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              You've earned {coinsAwarded} Corra Coins as a welcome bonus!
            </Text>

            {/* Coin display */}
            <View style={styles.coinDisplay}>
              <View style={styles.coinIcon}>
                <Text style={styles.coinText}>CC</Text>
              </View>
              <Text style={styles.coinAmount}>{coinsAwarded}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              Start earning more coins by uploading your bills and shopping with our partner brands.
              Redeem your coins for exciting rewards and cashbacks!
            </Text>

            {/* Action button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
              <Text style={styles.actionButtonText}>Start Earning!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    padding: spacing[8],
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing[6],
    opacity: 0.9,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  coinIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
    ...shadows.md,
  },
  coinText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  coinAmount: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 22,
    opacity: 0.9,
  },
  actionButton: {
    backgroundColor: colors.text.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  actionButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary[600],
  },
});
