import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loginWithEmail, loginWithMobilePassword, sendLoginOTP } = useAuthStore();

  const handleLogin = async () => {
    const id = identifier.trim();
    const pwd = password.trim();

    if (!id) {
      Alert.alert('Missing Information', 'Please enter your mobile number or email');
      return;
    }

    if (!pwd) {
      setIsLoading(false);
      Alert.alert('Missing Password', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      if (id.includes('@')) {
        // Email login
        await loginWithEmail(id, pwd);
        router.replace('/(tabs)/home');
      } else {
        // Mobile number login - try password first, fallback to OTP if no password
        try {
          await loginWithMobilePassword(id, pwd);
          router.replace('/(tabs)/home');
        } catch (passwordError) {
          // If password login fails, check if it's because user doesn't have password
          if (passwordError instanceof Error && 
              (passwordError.message.includes('Password not set') || 
               passwordError.message.includes('Invalid credentials'))) {
            // Fallback to OTP login
            await sendLoginOTP(id);
            router.push('/auth/login-otp');
          } else {
            throw passwordError;
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('Login Failed', error.message);
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = async () => {
    const id = identifier.trim();
    
    if (!id) {
      Alert.alert('Missing Information', 'Please enter your mobile number or email first');
      return;
    }

    if (id.includes('@')) {
      // For email, show message about password reset
      Alert.alert('Password Reset', 'Password reset functionality will be implemented in Phase 2B');
    } else {
      // For mobile number, send OTP for password reset
      try {
        setIsLoading(true);
        await sendLoginOTP(id);
        Alert.alert('OTP Sent', 'An OTP has been sent to your mobile number for password reset');
        router.push('/auth/login-otp');
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Error', 'Failed to send OTP. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    // Navigate to Google OAuth for login
    router.push({
      pathname: '/auth/google-auth',
      params: { isRegistration: 'false' }
    });
  };

  const handleOtpLogin = async () => {
    const id = identifier.trim();
    
    if (!id) {
      Alert.alert('Missing Information', 'Please enter your mobile number first');
      return;
    }

    if (id.includes('@')) {
      Alert.alert('Invalid Input', 'OTP login is only available for mobile numbers');
      return;
    }

    try {
      setIsLoading(true);
      await sendLoginOTP(id);
      router.push('/auth/login-otp');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

          {/* Login Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>
              Sign in to your Club Corra account to continue earning rewards
            </Text>

            {/* Identifier Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile Number or Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your mobile number or email"
                placeholderTextColor={colors.text.placeholder}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={identifier.includes('@') ? 'email-address' : 'phone-pad'}
              />
            </View>

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
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.loginButton}
            />

            {/* Alternative Login Options */}
            <View style={styles.alternativesContainer}>
              <Text style={styles.alternativesText}>Or continue with</Text>
              
              <View style={styles.alternativeButtons}>
                <TouchableOpacity
                  style={styles.alternativeButton}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color={colors.text.dark} />
                  <Text style={styles.alternativeButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alternativeButton}
                  onPress={handleOtpLogin}
                  activeOpacity={0.8}
                >
                  <Ionicons name="phone-portrait" size={20} color={colors.text.dark} />
                  <Text style={styles.alternativeButtonText}>OTP</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: spacing[4],
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
    marginBottom: 0,
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
    marginBottom: 0,
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
    marginBottom: spacing[5],
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
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
    padding: spacing[3],
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
  },
  forgotPasswordText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  loginButton: {
    marginBottom: spacing[4],
    ...shadows.gold,
  },
  alternativesContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  alternativesText: {
    fontSize: typography.fontSize.md,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  alternativeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing[4],
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    flex: 1,
    ...shadows.sm,
    elevation: 2,
  },
  alternativeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.dark,
    fontFamily: typography.fontFamily.semiBold,
    marginLeft: spacing[3],
  },
});
