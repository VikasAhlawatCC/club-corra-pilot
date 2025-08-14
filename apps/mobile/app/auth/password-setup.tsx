import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function PasswordSetupScreen() {
  const { mobileNumber, firstName, lastName } = useLocalSearchParams<{ 
    mobileNumber: string; 
    firstName: string; 
    lastName: string; 
  }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;

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
    const isPasswordValid = password.length >= 8;
    const isConfirmPasswordValid = password === confirmPassword && confirmPassword.length > 0;
    setIsValid(isPasswordValid && isConfirmPasswordValid);
  }, [password, confirmPassword]);

  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return { 
        isValid: false, 
        message: 'Password must contain uppercase, lowercase, number, and special character' 
      };
    }
    
    return { isValid: true, message: 'Strong password' };
  };

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert('Invalid Password', 'Please ensure both passwords match and meet the requirements');
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Weak Password', passwordValidation.message);
      return;
    }
    
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start registration again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Use mobile number directly for password setup
      // The user object will be created/updated on the backend during this process
      
      // Setup password using auth store with mobile number
      await useAuthStore.getState().setupPassword(mobileNumber, {
        password,
        confirmPassword
      });
      
      setIsLoading(false);
      
      // Navigate to email verification (optional step)
      router.push({
        pathname: '/auth/email-verification',
        params: { 
          mobileNumber,
          firstName,
          lastName,
          isOptional: 'true'
        }
      });
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        if (error.message.includes('Account already exists')) {
          Alert.alert(
            'Account Exists', 
            'This mobile number is already registered. Please use the login page instead.',
            [
              { 
                text: 'Go to Login', 
                onPress: () => router.push('/auth/login') 
              }
            ]
          );
          return;
        }
        Alert.alert('Setup Failed', error.message);
      } else {
        Alert.alert('Error', 'Failed to setup password. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getPasswordStrengthColor = () => {
    const validation = validatePasswordStrength(password);
    if (validation.isValid) return colors.success[500];
    if (password.length >= 6) return colors.warning[500];
    return colors.error[500];
  };

  const getPasswordStrengthText = () => {
    const validation = validatePasswordStrength(password);
    if (validation.isValid) return 'Strong';
    if (password.length >= 6) return 'Medium';
    return 'Weak';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
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

            {/* Password Setup Form */}
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
                <Text style={styles.formTitle}>Set Your Password</Text>
                <Text style={styles.formSubtitle}>
                  Create a strong password to secure your account
                </Text>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.text.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBar}>
                        <View 
                          style={[
                            styles.strengthFill, 
                            { 
                              width: `${Math.min((password.length / 8) * 100, 100)}%`,
                              backgroundColor: getPasswordStrengthColor()
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                        {getPasswordStrengthText()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.text.placeholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password match indicator */}
                  {confirmPassword.length > 0 && (
                    <View style={styles.matchIndicator}>
                      <Ionicons
                        name={password === confirmPassword ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={password === confirmPassword ? colors.success[500] : colors.error[500]}
                      />
                      <Text style={[
                        styles.matchText,
                        { color: password === confirmPassword ? colors.success[500] : colors.error[500] }
                      ]}>
                        {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirementItem}>
                    <Ionicons
                      name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={password.length >= 8 ? colors.success[500] : colors.text.secondary}
                    />
                    <Text style={styles.requirementText}>At least 8 characters</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons
                      name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={/[A-Z]/.test(password) ? colors.success[500] : colors.text.secondary}
                    />
                    <Text style={styles.requirementText}>One uppercase letter</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons
                      name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={/[a-z]/.test(password) ? colors.success[500] : colors.text.secondary}
                    />
                    <Text style={styles.requirementText}>One lowercase letter</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons
                      name={/\d/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={/\d/.test(password) ? colors.success[500] : colors.text.secondary}
                    />
                    <Text style={styles.requirementText}>One number</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Ionicons
                      name={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? colors.success[500] : colors.text.secondary}
                    />
                    <Text style={styles.requirementText}>One special character</Text>
                  </View>
                </View>

                {/* Continue Button */}
                <Button
                  title={isLoading ? "Setting up..." : "Continue"}
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
                    <LoadingSpinner size="small" variant="primary" text="Setting up password..." />
                  </View>
                )}
              </Card>
            </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[10],
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
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.input.border,
    paddingHorizontal: spacing[4],
    ...shadows.md,
  },
  passwordInput: {
    flex: 1,
    height: 56,
    fontSize: typography.fontSize.lg,
    color: colors.text.input,
    fontFamily: typography.fontFamily.medium,
  },
  eyeButton: {
    padding: spacing[2],
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[3],
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.input.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  strengthText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    minWidth: 50,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  matchText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  requirementsContainer: {
    width: '100%',
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.input.border,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  continueButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  loadingContainer: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
});
