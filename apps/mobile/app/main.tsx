import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';

export default function MainScreen() {
  const handleGoToHome = () => {
    // Navigate to main app home
    router.replace('/(tabs)/home');
  };

  const handleLearnMore = () => {
    // Navigate to learning/onboarding screens
    Alert.alert('Learn More', 'This will navigate to learning screens');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Elite Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>CC</Text>
              </View>
              <View style={styles.appNameContainer}>
                <Text style={styles.appName}>Club Corra</Text>
              </View>
            </View>
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>Welcome to Club Corra!</Text>
              <View style={styles.celebrationIcon}>
                <Ionicons name="sparkles" size={24} color={colors.gold[700]} />
              </View>
            </View>
            <Text style={styles.welcomeSubtitle}>
              Your account has been created successfully. You've earned 100 Corra Coins as a welcome bonus!
            </Text>
          </View>

          {/* Corra Coins Bonus Card */}
          <Card variant="elevated" padding={8} style={styles.bonusCard}>
            <View style={styles.coinIconContainer}>
              <View style={styles.coinIcon}>
                <Ionicons name="business" size={32} color={colors.text.dark} />
              </View>
            </View>
            <Text style={styles.coinAmount}>100 Corra Coins</Text>
            <Text style={styles.bonusText}>Welcome Bonus Added to Your Account</Text>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Go to Home"
              onPress={handleGoToHome}
              variant="primary"
              size="large"
              fullWidth
              style={styles.primaryButton}
            />
            
            <Button
              title="Learn How to Earn More"
              onPress={handleLearnMore}
              variant="secondary"
              size="large"
              fullWidth
              style={styles.secondaryButton}
            />
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={20} color={colors.gold[700]} />
              <Text style={styles.infoText}>Start earning coins with every purchase</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="gift" size={20} color={colors.gold[700]} />
              <Text style={styles.infoText}>Redeem coins for cashbacks & rewards</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trending-up" size={20} color={colors.gold[700]} />
              <Text style={styles.infoText}>Exclusive member benefits & offers</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark[900],
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
    borderWidth: 3,
    borderColor: colors.text.dark,
    ...shadows.glass,
  },
  logoText: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.dark,
  },
  appNameContainer: {
    flex: 1,
  },
  appName: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.text.gold,
    marginBottom: spacing[2],
    ...shadows.gold,
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.medium,
    opacity: 0.9,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  welcomeTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginRight: spacing[3],
  },
  celebrationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[700],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.gold,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing[4],
  },
  bonusCard: {
    alignItems: 'center',
    padding: spacing[8],
    marginBottom: spacing[8],
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
  },
  coinIconContainer: {
    marginBottom: spacing[4],
  },
  coinIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text.dark,
    ...shadows.gold,
  },
  coinAmount: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.gold,
    marginBottom: spacing[2],
    textAlign: 'center',
    ...shadows.gold,
  },
  bonusText: {
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
  actionButtons: {
    marginBottom: spacing[8],
  },
  primaryButton: {
    marginBottom: spacing[4],
    ...shadows.gold,
  },
  secondaryButton: {
    ...shadows.md,
  },
  quickInfo: {
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    backgroundColor: glassEffects.primary.backgroundColor,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: glassEffects.primary.borderColor,
    ...shadows.sm,
  },
  infoText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginLeft: spacing[3],
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
});
