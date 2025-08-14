import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';
import { oauthService } from '@/services/oauth.service';

export default function GoogleAuthScreen() {
  const { mobileNumber, isRegistration } = useLocalSearchParams<{ 
    mobileNumber?: string; 
    isRegistration: string;
  }>();
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { oauthSignup, loginWithOAuth } = useAuthStore();

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      // Check if OAuth is properly configured
      if (!oauthService.isConfigured()) {
        throw new Error('OAuth is not properly configured. Please check your environment variables.');
      }

      // Initiate Google OAuth flow
      const { code, redirectUri } = await oauthService.authenticateWithGoogle();
      
      if (isRegistration === 'true') {
        // For registration, use OAuth signup
        const response = await oauthSignup('GOOGLE', code, redirectUri);
        
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully. You can now complete your profile.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to profile setup with OAuth data
                router.push({
                  pathname: '/auth/profile-setup',
                  params: { 
                    mobileNumber: mobileNumber || '',
                    email: response.user?.email || '',
                    verificationMethod: 'oauth'
                  }
                });
              }
            }
          ]
        );
      } else {
        // For login, use OAuth login
        const response = await loginWithOAuth('GOOGLE', code);
        
        Alert.alert(
          'Login Successful',
          'Welcome back to Club Corra!',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.replace('/(tabs)/home');
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('OAuth is not properly configured')) {
          Alert.alert(
            'Configuration Error',
            'OAuth is not properly configured. Please contact support.',
            [{ text: 'OK' }]
          );
        } else if (error.message.includes('authentication failed')) {
          Alert.alert(
            'Authentication Failed',
            'Google authentication failed. Please try again.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Authentication Failed', error.message);
        }
      } else {
        Alert.alert('Error', 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAlternativeMethod = () => {
    if (isRegistration === 'true') {
      // Go back to email verification for alternative method
      router.back();
    } else {
      // Go back to login for alternative method
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>CC</Text>
              </View>
              <Text style={styles.appName}>Club Corra</Text>
            </View>
          </View>

          {/* Google OAuth Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isRegistration === 'true' ? 'Complete Registration' : 'Quick Login'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isRegistration === 'true' 
                ? 'Use your Google account to quickly complete your registration'
                : 'Sign in to your Club Corra account using Google'
              }
            </Text>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={24} color={colors.text.dark} />
              </View>
              <Text style={styles.googleButtonText}>
                {isLoading 
                  ? 'Authenticating...' 
                  : `Continue with Google${isRegistration === 'true' ? ' (Registration)' : ' (Login)'}`
                }
              </Text>
            </TouchableOpacity>

            {/* Alternative Method */}
            <View style={styles.alternativeContainer}>
              <Text style={styles.alternativeText}>Or use alternative method</Text>
              <TouchableOpacity
                style={styles.alternativeButton}
                onPress={handleAlternativeMethod}
                activeOpacity={0.8}
              >
                <Text style={styles.alternativeButtonText}>
                  {isRegistration === 'true' ? 'Use Email OTP' : 'Use Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color={colors.primary[400]} />
              <Text style={styles.infoText}>
                {isRegistration === 'true'
                  ? 'We\'ll use your Google account information to create your Club Corra profile'
                  : 'We\'ll securely authenticate you using your Google account'
                }
              </Text>
            </View>
          </Card>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: glassEffects.primary.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: glassEffects.primary.borderColor,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    ...shadows.glass,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  logoText: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.text.primary,
    marginBottom: spacing[2],
    ...shadows.gold,
  },
  formCard: {
    alignItems: 'center',
    padding: spacing[8],
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
  },
  formTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: 32,
  },
  formSubtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 24,
    paddingHorizontal: spacing[4],
  },
  oauthContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    width: '100%',
    ...shadows.lg,
  },
  googleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    ...shadows.md,
  },
  googleButtonText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.dark,
    fontFamily: typography.fontFamily.semiBold,
  },
  loadingSpinner: {
    marginLeft: spacing[3],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[8],
    ...shadows.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.white,
    marginLeft: spacing[3],
    flex: 1,
    lineHeight: 18,
  },
  alternativeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  alternativeTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  alternativeButton: {
    marginBottom: spacing[3],
    ...shadows.md,
  },
  alternativeText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  alternativeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
});
