import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';

export default function AuthChoiceScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Staggered entrance animation
    const entranceAnimation = Animated.sequence([
      // Logo animation
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: animation.spring.logo.tension,
        friction: animation.spring.logo.friction,
        useNativeDriver: true,
      }),
      // Content fade in and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animation.timing.slide.duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(slideUpAnim, {
          toValue: 0,
          tension: animation.spring.content.tension,
          friction: animation.spring.content.friction,
          useNativeDriver: true,
        }),
      ]),
      // Card scale animation
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: animation.spring.card.tension,
        friction: animation.spring.card.friction,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();
  }, [fadeAnim, slideUpAnim, logoScaleAnim, cardScaleAnim]);

  const handleLogin = () => {
    // Add haptic feedback and smooth navigation
    router.push('/auth/login');
  };

  const handleRegister = () => {
    // Add haptic feedback and smooth navigation
    router.push('/auth/register');
  };



  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
          {/* Elite Header with Animation */}
          <Animated.View 
            style={[
              styles.header,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>CC</Text>
              </View>
              <Text style={styles.appName}>Club Corra</Text>
            </View>
          </Animated.View>

          {/* Welcome Message with Animation */}
          <Animated.View 
            style={[
              styles.welcomeContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeTitle}>Welcome to Club Corra</Text>
            <Text style={styles.welcomeSubtitle}>
              Choose how you&apos;d like to get started with your premium rewards experience
            </Text>
          </Animated.View>

          {/* Choice Card with Animation */}
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { scale: cardScaleAnim },
                ],
              },
            ]}
          >
            <Card variant="elevated" padding={8} style={styles.choiceCard}>
              {/* Login Option */}
              <View style={styles.optionContainer}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="log-in" size={24} color={colors.primary[400]} />
                  </View>
                  <Text style={styles.optionTitle}>Already a Member?</Text>
                  <Text style={styles.optionSubtitle}>
                    Sign in to your existing account and continue earning rewards
                  </Text>
                </View>
                
                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  variant="primary"
                  size="large"
                  style={styles.choiceButton}
                />
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Option */}
              <View style={styles.optionContainer}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="person-add" size={24} color={colors.gold[400]} />
                  </View>
                  <Text style={styles.optionTitle}>New to Club Corra?</Text>
                  <Text style={styles.optionSubtitle}>
                    Create your account and start earning exclusive rewards today
                  </Text>
                </View>
                
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  variant="secondary"
                  size="large"
                  style={styles.choiceButton}
                />
              </View>



              {/* Google OAuth removed from first screen per product requirement */}
            </Card>
          </Animated.View>

          {/* Footer with Animation */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
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
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[0],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    ...shadows.glass,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  appName: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.text.primary,
    marginBottom: spacing[2],
    ...shadows.gold,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  welcomeTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  choiceCard: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
  },
  optionContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  optionHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  optionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.input.border,
  },
  optionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: 28,
  },
  optionSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[3],
  },
  choiceButton: {
    marginBottom: spacing[3],
    height: 48,
    alignSelf: 'center',
    minWidth: 220,
    ...shadows.gold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
    width: '100%',
    paddingHorizontal: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.text.muted,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: spacing[4],
    color: colors.text.gold,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    backgroundColor: glassEffects.card.backgroundColor,
    paddingHorizontal: spacing[3],
  },
  quickAccessSection: {
    width: '100%',
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.text.gold,
    textDecorationLine: 'underline',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    alignSelf: 'center',
  },
  
});
