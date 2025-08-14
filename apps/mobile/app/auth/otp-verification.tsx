import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function OtpVerificationScreen() {
  const { mobileNumber, firstName, lastName } = useLocalSearchParams<{ 
    mobileNumber: string; 
    firstName?: string; 
    lastName?: string; 
  }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const { verifyOTP, resendOTP } = useAuthStore();

  // Start countdown for resend OTP
  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP sent to your phone');
      return;
    }
    
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start registration again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Verify OTP using auth store
      await verifyOTP(otp);
      
      // Navigate to password setup with mobile number and user details
      router.push({
        pathname: '/auth/password-setup',
        params: { 
          mobileNumber,
          firstName: firstName || '',
          lastName: lastName || ''
        }
      });
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('Verification Failed', error.message);
      } else {
        Alert.alert('Error', 'OTP verification failed. Please try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found. Please start registration again.');
      return;
    }

    try {
      await resendOTP();
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

          {/* OTP Verification Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>Verify Your Phone</Text>
            <Text style={styles.formSubtitle}>
              We've sent a 4-digit OTP to {mobileNumber || 'your mobile number'}
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="0000"
                placeholderTextColor={colors.text.placeholder}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
                textAlign="center"
              />
            </View>

            {/* Verify Button */}
            <Button
              title="Verify OTP"
              onPress={handleVerifyOtp}
              loading={isLoading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.verifyButton}
            />

            {/* Resend OTP */}
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
  otpContainer: {
    width: '100%',
    marginBottom: spacing[6],
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
    ...shadows.lg,
  },
  verifyButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  resendText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
  },
  resendButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  resendButtonText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  resendButtonTextDisabled: {
    color: colors.text.placeholder,
  },
});
