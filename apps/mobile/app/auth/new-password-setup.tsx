import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { environment } from '@/config/environment';

export default function NewPasswordSetupScreen() {
  const params = useLocalSearchParams();
  const { mobileNumber, userId } = params;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Password strength indicators
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);

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

  // Validate password strength
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
  }, [password]);

  // Validate form
  useEffect(() => {
    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
    const isConfirmValid = password === confirmPassword && password.length > 0;
    setIsValid(isPasswordValid && isConfirmValid);
  }, [password, confirmPassword, hasMinLength, hasUppercase, hasLowercase, hasNumber]);

  const handleSetupPassword = async () => {
    if (!isValid) {
      Alert.alert('Invalid Password', 'Please ensure your password meets all requirements and matches confirmation');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${environment.apiBaseUrl}/auth/signup/setup-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber as string,
          password: password,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to setup password');
      }

      setIsLoading(false);
      
      // Navigate to email verification or main app
      if (data.requiresEmailVerification) {
        router.push({ 
          pathname: '/auth/new-email-verification', 
          params: { 
            mobileNumber: mobileNumber as string,
            userId: data.userId,
          } 
        });
      } else {
        // Account is fully activated, go to main app
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to setup password. Please try again.');
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
  };

  const handleInputBlur = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const getStrengthColor = (isValid: boolean) => {
    return isValid ? colors.success[500] : colors.text.muted;
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
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.passwordInput,
                        ]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.text.muted}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={togglePasswordVisibility}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={20}
                          color={colors.text.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Strength Indicator */}
                  <View style={styles.strengthContainer}>
                    <Text style={styles.strengthLabel}>Password Requirements:</Text>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={getStrengthColor(hasMinLength)}
                      />
                      <Text style={[styles.requirementText, { color: getStrengthColor(hasMinLength) }]}>
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={hasUppercase ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={getStrengthColor(hasUppercase)}
                      />
                      <Text style={[styles.requirementText, { color: getStrengthColor(hasUppercase) }]}>
                        One uppercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={hasLowercase ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={getStrengthColor(hasLowercase)}
                      />
                      <Text style={[styles.requirementText, { color: getStrengthColor(hasLowercase) }]}>
                        One lowercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Ionicons
                        name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={getStrengthColor(hasNumber)}
                      />
                      <Text style={[styles.requirementText, { color: getStrengthColor(hasNumber) }]}>
                        One number
                      </Text>
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.passwordInput,
                          confirmPassword && password !== confirmPassword && styles.textInputError,
                        ]}
                        placeholder="Confirm your password"
                        placeholderTextColor={colors.text.muted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={toggleConfirmPasswordVisibility}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={20}
                          color={colors.text.muted}
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPassword && password !== confirmPassword && (
                      <Text style={styles.errorText}>Passwords do not match</Text>
                    )}
                  </View>

                  {/* Setup Button */}
                  <Button
                    title={isLoading ? "Setting Up..." : "Setup Password"}
                    onPress={handleSetupPassword}
                    variant="primary"
                    size="large"
                    disabled={!isValid || isLoading}
                    style={styles.setupButton}
                    loading={isLoading}
                  />

                  <Text style={styles.helpText}>
                    Your password will be securely encrypted and stored
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
  passwordInput: {
    paddingRight: spacing[12],
  },
  textInputError: {
    borderColor: colors.error[500],
    borderWidth: 2,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing[4],
    top: spacing[3],
    padding: spacing[1],
  },
  strengthContainer: {
    marginBottom: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
  },
  strengthLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginLeft: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
    marginTop: spacing[2],
    fontFamily: typography.fontFamily.regular,
  },
  setupButton: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
});
