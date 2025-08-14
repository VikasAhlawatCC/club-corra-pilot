import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function EmailVerificationScreen() {
  const { mobileNumber, firstName, lastName, isOptional } = useLocalSearchParams<{ 
    mobileNumber: string; 
    firstName?: string; 
    lastName?: string; 
    isOptional?: string; 
  }>();
  const [email, setEmail] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'otp' | 'oauth'>('otp');
  const [isLoading, setIsLoading] = useState(false);
  
  const { initiateSignup } = useAuthStore();

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address');
      return;
    }
    
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start registration again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Initiate signup with email verification
      await initiateSignup({
        mobileNumber,
        email: email.trim(),
        authMethod: verificationMethod === 'oauth' ? 'GOOGLE' : 'EMAIL'
      });
      
      // If email verification is optional, navigate directly to main app
      if (isOptional === 'true') {
        router.replace('/(tabs)/home');
      } else {
        // Navigate to profile setup with mobile number and email
        router.push({
          pathname: '/auth/profile-setup',
          params: { 
            mobileNumber,
            email: email.trim(),
            verificationMethod
          }
        });
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('Verification Failed', error.message);
      } else {
        Alert.alert('Error', 'Email verification failed. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGoogleOAuth = () => {
    // Navigate to Google OAuth screen
    router.push({
      pathname: '/auth/google-auth',
      params: { 
        mobileNumber,
        isRegistration: 'true'
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
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

          {/* Email Verification Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isOptional === 'true' ? 'Add Your Email (Optional)' : 'Verify Your Email'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isOptional === 'true' 
                ? 'Add your email for account recovery and notifications. You can skip this step for now.'
                : 'Choose how you\'d like to verify your email address'
              }
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                placeholderTextColor={colors.text.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            {/* Verification Method Selection */}
            <View style={styles.methodContainer}>
              <Text style={styles.methodLabel}>Verification Method</Text>
              
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  verificationMethod === 'otp' && styles.methodOptionSelected
                ]}
                onPress={() => setVerificationMethod('otp')}
                activeOpacity={0.8}
              >
                <View style={styles.methodIconContainer}>
                  <Ionicons 
                    name="mail" 
                    size={24} 
                    color={verificationMethod === 'otp' ? colors.primary[400] : colors.text.secondary} 
                  />
                </View>
                <View style={styles.methodContent}>
                  <Text style={[
                    styles.methodTitle,
                    verificationMethod === 'otp' && styles.methodTitleSelected
                  ]}>
                    Email OTP
                  </Text>
                  <Text style={styles.methodDescription}>
                    Receive a verification code via email
                  </Text>
                </View>
                {verificationMethod === 'otp' && (
                  <View style={styles.methodCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[400]} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  verificationMethod === 'oauth' && styles.methodOptionSelected
                ]}
                onPress={() => setVerificationMethod('oauth')}
                activeOpacity={0.8}
              >
                <View style={styles.methodIconContainer}>
                  <Ionicons 
                    name="logo-google" 
                    size={24} 
                    color={verificationMethod === 'oauth' ? colors.primary[400] : colors.text.secondary} 
                  />
                </View>
                <View style={styles.methodContent}>
                  <Text style={[
                    styles.methodTitle,
                    verificationMethod === 'oauth' && styles.methodTitleSelected
                  ]}>
                    Google OAuth
                  </Text>
                  <Text style={styles.methodDescription}>
                    Quick verification using your Google account
                  </Text>
                </View>
                {verificationMethod === 'oauth' && (
                  <View style={styles.methodCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[400]} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <Button
              title={isOptional === 'true' ? "Add Email" : "Continue"}
              onPress={handleContinue}
              loading={isLoading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.continueButton}
            />

            {/* Skip Option (only show when email verification is optional) */}
            {isOptional === 'true' && (
              <TouchableOpacity
                onPress={() => {
                  // Navigate directly to main app since email verification is optional
                  router.replace('/(tabs)/home');
                }}
                style={styles.skipButton}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            )}

            {/* Alternative OAuth Option */}
            {verificationMethod === 'otp' && (
              <View style={styles.alternativeContainer}>
                <Text style={styles.alternativeText}>Or continue with</Text>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleOAuth}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color={colors.text.primary} />
                  <Text style={styles.googleButtonText}>Google</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
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
  content: {
    flexGrow: 1, // Allow content to grow and take available space
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
  inputContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  textInput: {
    height: 56,
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.input.border,
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.lg,
    color: colors.text.input,
    fontFamily: typography.fontFamily.medium,
    ...shadows.md,
  },
  methodContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  methodLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.input.border,
    ...shadows.md,
  },
  methodOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[400],
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    ...shadows.sm,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  methodTitleSelected: {
    color: colors.text.white,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  methodCheckmark: {
    marginLeft: spacing[2],
  },
  continueButton: {
    marginBottom: spacing[4],
    ...shadows.gold,
  },
  alternativeContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[6],
  },
  alternativeText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
     googleButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: colors.background.card,
     paddingVertical: spacing[3],
     paddingHorizontal: spacing[6],
     borderRadius: borderRadius.lg,
     ...shadows.md,
   },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  skipButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    marginTop: spacing[4],
  },
  skipButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
});
