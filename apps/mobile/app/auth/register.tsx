import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { formatIndianMobileNumber } from '@shared/utils';

export default function RegisterScreen() {
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
      
      const { useAuthStore } = require('@/stores/auth.store');
      const initiate = useAuthStore.getState().initiateSignup;
      await initiate({ 
        mobileNumber: fullMobileNumber, 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        authMethod: 'SMS' 
      });
      setIsLoading(false);
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
      Alert.alert('Error', 'Failed to initiate signup. Please try again.');
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
                      style={styles.textInput}
                      placeholder="Enter your first name"
                      placeholderTextColor={colors.text.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </View>

                  {/* Last Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your last name"
                      placeholderTextColor={colors.text.placeholder}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </View>

                  {/* Mobile Number Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Mobile Number</Text>
                    <Animated.View 
                      style={[
                        styles.phoneInputWrapper,
                        {
                          transform: [
                            {
                              scale: Animated.add(1, Animated.multiply(inputFocusAnim, 0.02)),
                            },
                          ],
                          // Use static color toggled by focus state to avoid invalid Animated color operations
                          borderColor: isFocused ? colors.input.borderFocused : colors.input.border,
                        },
                      ]}
                    >
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter mobile number"
                        placeholderTextColor={colors.text.placeholder}
                        value={mobileNumber}
                        onChangeText={setMobileNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                      {/* Validation indicator */}
                      {mobileNumber.length > 0 && (
                        <View style={styles.validationIndicator}>
                          <Ionicons
                            name={mobileNumber.length === 10 && /^\d+$/.test(mobileNumber) ? "checkmark-circle" : "close-circle"}
                            size={20}
                            color={mobileNumber.length === 10 && /^\d+$/.test(mobileNumber) ? colors.success[500] : colors.error[500]}
                          />
                        </View>
                      )}
                    </Animated.View>
                    
                    {/* Validation message */}
                    {mobileNumber.length > 0 && mobileNumber.length !== 10 && (
                      <Animated.Text
                        style={[
                          styles.validationMessage,
                          {
                            opacity: fadeAnim,
                          },
                        ]}
                      >
                        Please enter a valid 10-digit mobile number
                      </Animated.Text>
                    )}
                  </View>

                  {/* Continue Button */}
                  <Button
                    title={isLoading ? "Processing..." : "Continue"}
                    onPress={handleContinue}
                    loading={isLoading}
                    variant="primary"
                    size="large"
                    fullWidth
                    disabled={!isValid || isLoading}
                    style={[styles.continueButton, { opacity: isValid ? 1 : 0.6 }]}
                  />

                  {/* Loading indicator */}
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <LoadingSpinner size="small" variant="primary" text="Initiating signup..." />
                    </View>
                  )}
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
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
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
  formContainer: {
    width: '100%',
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
    width: '100%',
    height: 56,
    fontSize: typography.fontSize.lg,
    color: colors.text.input,
    fontFamily: typography.fontFamily.medium,
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.input.border,
    paddingHorizontal: spacing[4],
    ...shadows.md,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.input.border,
    paddingHorizontal: spacing[4],
    ...shadows.md,
  },
  countryCodeContainer: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    marginRight: spacing[3],
  },
  countryCode: {
    fontSize: typography.fontSize.md,
    color: colors.text.white,
    fontFamily: typography.fontFamily.bold,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    fontSize: typography.fontSize.lg,
    color: colors.text.input,
    fontFamily: typography.fontFamily.medium,
  },
  continueButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  validationIndicator: {
    position: 'absolute',
    right: spacing[4],
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  validationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
  loadingContainer: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
});
