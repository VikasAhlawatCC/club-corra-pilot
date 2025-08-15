import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';
import { formatIndianMobileNumber } from '@shared/utils';

export default function LoginOtpScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const { sendLoginOTP, login } = useAuthStore();

  // Start countdown for resend OTP
  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      // Format mobile number with country code
      const fullMobileNumber = formatIndianMobileNumber(mobileNumber);
      await sendLoginOTP(fullMobileNumber);
      setIsOtpSent(true);
      setResendCountdown(60); // 60 second countdown
      Alert.alert('OTP Sent', 'A verification code has been sent to your mobile number');
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('OTP Send Failed', error.message);
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP sent to your phone');
      return;
    }
    
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start login again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Format mobile number with country code
      const fullMobileNumber = formatIndianMobileNumber(mobileNumber);
      // Login with OTP
      console.log('Attempting login with:', { mobileNumber: fullMobileNumber, otp });
      const result = await login(fullMobileNumber, otp);
      console.log('Login result:', result);
      
      // Navigate to main app on successful login
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Login error details:', error);
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('Login Failed', error.message);
      } else {
        Alert.alert('Error', 'OTP verification failed. Please try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start login again.');
      return;
    }

    try {
      // Format mobile number with country code
      const fullMobileNumber = formatIndianMobileNumber(mobileNumber);
      await sendLoginOTP(fullMobileNumber);
      setResendCountdown(60); // 60 second countdown
      Alert.alert('OTP Sent', 'A new verification code has been sent to your mobile number');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
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

          {/* OTP Login Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>Login with OTP</Text>
            <Text style={styles.formSubtitle}>
              {isOtpSent 
                ? 'Enter the 6-digit verification code sent to your mobile number'
                : 'Enter your mobile number to receive a verification code'
              }
            </Text>

            {!isOtpSent ? (
              /* Mobile Number Input */
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputWrapper}>
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
                  />
                </View>
              </View>
            ) : (
              /* OTP Input */
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Verification Code</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor={colors.text.placeholder}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
              </View>
            )}

            {/* Action Button */}
            <Button
              title={isOtpSent ? "Verify OTP" : "Send OTP"}
              onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
              loading={isLoading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.actionButton}
            />

            {/* Resend OTP */}
            {isOtpSent && (
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendCountdown > 0}
                  style={styles.resendButton}
                >
                  <Text style={[
                    styles.resendButtonText,
                    resendCountdown > 0 && styles.resendButtonTextDisabled
                  ]}>
                    {resendCountdown > 0 
                      ? `Resend in ${resendCountdown}s` 
                      : 'Resend OTP'
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Alternative Login Options */}
            <View style={styles.alternativesContainer}>
              <Text style={styles.alternativesText}>Or continue with</Text>
              
              <TouchableOpacity
                style={styles.alternativeButton}
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.8}
              >
                <Ionicons name="key" size={20} color={colors.text.primary} />
                <Text style={styles.alternativeButtonText}>Password Login</Text>
              </TouchableOpacity>
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
  inputContainer: {
    width: '100%',
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.input.border,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
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
  sendOtpButton: {
    marginBottom: spacing[4],
    ...shadows.gold,
  },
  otpContainer: {
    width: '100%',
    marginBottom: spacing[4],
  },
  otpLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  otpInput: {
    height: 80,
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.xl,
    borderWidth: 3,
    borderColor: colors.primary[500],
    fontSize: typography.fontSize['3xl'],
    color: colors.text.input,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 8,
    marginBottom: spacing[6],
    ...shadows.lg,
  },
  verifyButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
  },
  resendLink: {
    color: colors.primary[400],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  actionButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  resendButtonText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  resendButtonTextDisabled: {
    color: colors.text.placeholder,
  },
  alternativesContainer: {
    marginTop: spacing[8],
    alignItems: 'center',
  },
  alternativesText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderWidth: 1,
    borderColor: colors.input.border,
    ...shadows.md,
  },
  alternativeButtonText: {
    marginLeft: spacing[3],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
});
