import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { environment } from '@/config/environment';
import { useAuthStore } from '@/stores/auth.store';

export default function NewOtpVerificationScreen() {
  const params = useLocalSearchParams();
  const { mobileNumber, firstName, lastName } = params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isValid, setIsValid] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const otpInputRefs = useRef<TextInput[]>([]);
  const isVerifyingRef = useRef(false);
  const lastCallTimeRef = useRef(0);

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

  // Start resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Validate OTP
  useEffect(() => {
    const otpString = otp.join('');
    setIsValid(otpString.length === 6);
  }, [otp]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (!isValid || isLoading || isVerifyingRef.current) {
      if (!isValid) {
        Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      }
      return;
    }

    // Additional check to prevent duplicate calls
    const authStore = useAuthStore.getState();
    if (authStore.isLoading) {
      console.log('[DEBUG] Auth store is already loading, preventing duplicate call');
      return;
    }

    // Prevent multiple calls within 1 second
    const now = Date.now();
    if (now - lastCallTimeRef.current < 1000) {
      console.log('[DEBUG] Preventing duplicate call within 1 second window');
      return;
    }
    lastCallTimeRef.current = now;

    console.log('[DEBUG] handleVerifyOtp called, isLoading:', isLoading, 'isValid:', isValid, 'isVerifyingRef:', isVerifyingRef.current);
    isVerifyingRef.current = true;
    setIsLoading(true);
    
    // Store the OTP string to prevent it from being modified during verification
    const otpString = otp.join('');
    console.log('[DEBUG] Calling newVerifySignupOtp with OTP:', otpString);
    
    try {
      // Use the auth store for the new auth flow
      const { newVerifySignupOtp } = useAuthStore.getState();
      const data = await newVerifySignupOtp({
        mobileNumber: mobileNumber as string,
        otpCode: otpString,
      });

      console.log('[DEBUG] OTP verification successful, navigating to password setup');
      setIsLoading(false);
      isVerifyingRef.current = false;
      
      // Navigate to password setup
      router.push({ 
        pathname: '/auth/password-setup', 
        params: { 
          mobileNumber: mobileNumber as string,
          userId: data.userId,
        } 
      });
    } catch (error) {
      console.log('[DEBUG] OTP verification failed:', error);
      setIsLoading(false);
      isVerifyingRef.current = false;
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.');
    }
  }, [isValid, isLoading, otp, mobileNumber]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      // Use the auth store for resending OTP
      const { newInitialSignup } = useAuthStore.getState();
      await newInitialSignup({
        firstName: firstName as string,
        lastName: lastName as string,
        mobileNumber: mobileNumber as string,
      });

      setResendCooldown(30); // 30 second cooldown
      Alert.alert('OTP Resent', 'A new verification code has been sent to your mobile number');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatMobileNumber = (number: string) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return number;
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

              {/* OTP Verification Form */}
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
                  <Text style={styles.formTitle}>Verify Your Mobile</Text>
                  <Text style={styles.formSubtitle}>
                    Enter the 6-digit code sent to your mobile number
                  </Text>

                  {/* Mobile Number Display */}
                  <View style={styles.mobileDisplay}>
                    <Ionicons name="phone-portrait" size={20} color={colors.text.muted} />
                    <Text style={styles.mobileText}>
                      {formatMobileNumber(mobileNumber as string)}
                    </Text>
                  </View>

                  {/* OTP Input Fields */}
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Enter OTP Code</Text>
                    <View style={styles.otpInputs}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            if (ref) otpInputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpInput,
                            digit && styles.otpInputFilled,
                          ]}
                          value={digit}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                          editable={!isLoading && !isVerifyingRef.current}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Resend OTP */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <TouchableOpacity 
                      onPress={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending || isLoading || isVerifyingRef.current}
                      style={styles.resendButton}
                    >
                      <Text style={[
                        styles.resendButtonText,
                        (resendCooldown > 0 || isResending || isLoading || isVerifyingRef.current) && styles.resendButtonDisabled
                      ]}>
                        {isResending ? 'Sending...' : 
                         resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Verify Button */}
                  <Button
                    title={isLoading ? "Verifying..." : "Verify OTP"}
                    onPress={handleVerifyOtp}
                    variant="primary"
                    size="large"
                    disabled={!isValid || isLoading || isVerifyingRef.current}
                    style={styles.verifyButton}
                    loading={isLoading}
                  />

                  <Text style={styles.helpText}>
                    Having trouble? Contact our support team
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
  mobileDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[6],
  },
  mobileText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  otpContainer: {
    marginBottom: spacing[6],
  },
  otpLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border.input,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.input,
    textAlign: 'center',
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.regular,
  },
  resendButton: {
    paddingHorizontal: spacing[2],
  },
  resendButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontFamily: typography.fontFamily.medium,
  },
  resendButtonDisabled: {
    color: colors.text.muted,
  },
  verifyButton: {
    marginBottom: spacing[4],
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
});
