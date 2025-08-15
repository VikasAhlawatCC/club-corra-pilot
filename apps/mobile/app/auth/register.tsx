import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { formatIndianMobileNumber } from '@shared/utils';
import { environment } from '@/config/environment';
import { useAuthStore } from '@/stores/auth.store';

export default function NewSignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.timing.fade.duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: animation.spring.content.tension,
        friction: animation.spring.content.friction,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: animation.spring.card.tension,
        friction: animation.spring.card.friction,
        useNativeDriver: true,
      }),
    ]);

    entranceAnimation.start();
  }, [fadeAnim, slideUpAnim, cardScaleAnim]);

  // Validate form in real-time
  useEffect(() => {
    const isMobileValid = mobileNumber.length === 10 && /^\d+$/.test(mobileNumber);
    const isFirstNameValid = firstName.trim().length >= 2;
    const isLastNameValid = lastName.trim().length >= 2;
    setIsValid(isMobileValid && isFirstNameValid && isLastNameValid);
  }, [firstName, lastName, mobileNumber]);

  const handleContinue = async () => {
    if (!isValid) {
      // Trigger error animation
      Animated.sequence([
        Animated.timing(inputFocusAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputFocusAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (!firstName.trim()) {
        Alert.alert('Missing Information', 'Please enter your first name');
        return;
      }
      if (!lastName.trim()) {
        Alert.alert('Missing Information', 'Please enter your last name');
        return;
      }
      if (!mobileNumber || mobileNumber.length !== 10) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
        return;
      }
      return;
    }
    
    setIsLoading(true);
    try {
      // Format mobile number with country code
      const fullMobileNumber = formatIndianMobileNumber(mobileNumber);
      
      // Debug logging
      console.log('=== SIGNUP DEBUG ===');
      console.log('Environment API Base URL:', environment.apiBaseUrl);
      console.log('Full request URL:', `${environment.apiBaseUrl}/auth/signup/initial`);
      console.log('Request payload:', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: fullMobileNumber,
      });
      console.log('Network Info:', {
        userAgent: navigator.userAgent,
        platform: Platform.OS,
        version: Platform.Version,
      });
      console.log('====================');
      
      // Test network connectivity first
      try {
        const testResponse = await fetch(`${environment.apiBaseUrl}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Network connectivity test successful:', testResponse.status);
      } catch (testError) {
        console.error('Network connectivity test failed:', testError);
        throw new Error('Network connectivity test failed. Please check your connection to the server.');
      }
      
      // Use the auth store for the new auth flow
      const { newInitialSignup } = useAuthStore.getState();
      const data = await newInitialSignup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: fullMobileNumber,
      });
      
      // Check if user already exists
      if (data.redirectToLogin) {
        Alert.alert(
          'Account Already Exists',
          data.existingUserMessage || 'This mobile number is already registered. Please login instead.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.push('/auth/login'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      setIsLoading(false);
      
      // Navigate to OTP verification with the new flow
      router.push({ 
        pathname: '/auth/otp-verification', 
        params: { 
          mobileNumber: fullMobileNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        } 
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Signup error details:', error);
      
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof Error) {
        if (error.message === 'Network request failed') {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to reach the server. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleInputFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setIsFocused(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header with Back Button */}
              <Animated.View 
                style={[
                  styles.header,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                  },
                ]}
              >
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>CC</Text>
                  </View>
                  <Text style={styles.appName}>Club Corra</Text>
                </View>
              </Animated.View>

              {/* Registration Form */}
              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideUpAnim },
                      { scale: cardScaleAnim },
                    ],
                  },
                ]}
              >
                <Card variant="elevated" padding={8} style={styles.formCard}>
                  <Text style={styles.formTitle}>Create Your Account</Text>
                  <Text style={styles.formSubtitle}>
                    Start your journey with Club Corra by entering your details
                  </Text>

                  {/* First Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isFocused && styles.textInputFocused,
                      ]}
                      placeholder="Enter your first name"
                      placeholderTextColor={colors.text.muted}
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Last Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isFocused && styles.textInputFocused,
                      ]}
                      placeholder="Enter your last name"
                      placeholderTextColor={colors.text.muted}
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Mobile Number Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isFocused && styles.textInputFocused,
                      ]}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={colors.text.muted}
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    <Text style={styles.inputHint}>
                      We'll send you a verification code
                    </Text>
                  </View>

                  {/* Continue Button */}
                  <Button
                    title={isLoading ? "Creating Account..." : "Continue"}
                    onPress={handleContinue}
                    variant="primary"
                    size="large"
                    disabled={!isValid || isLoading}
                    style={styles.continueButton}
                    loading={isLoading}
                  />

                  <Text style={styles.termsText}>
                    By continuing, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </Card>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[6],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[3],
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    ...shadows.glass,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  logoText: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.display,
    color: colors.text.primary,
    ...shadows.gold,
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
  },
  formTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  formSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  textInput: {
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  textInputFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  inputHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing[2],
    fontFamily: typography.fontFamily.regular,
  },
  continueButton: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  termsLink: {
    color: colors.primary[400],
    fontFamily: typography.fontFamily.medium,
  },
});
