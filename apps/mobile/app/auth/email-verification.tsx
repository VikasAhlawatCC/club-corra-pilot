import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Easing, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects, animation } from '@/styles/theme';
import { environment } from '@/config/environment';
import { useAuthStore } from '@/stores/auth.store';

export default function NewEmailVerificationScreen() {
  const params = useLocalSearchParams();
  const { mobileNumber, userId } = params;
  
  const [email, setEmail] = useState('');
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

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(email));
  }, [email]);

  const handleAddEmail = async () => {
    if (!isValid) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Use the auth store for adding email
      const { newAddEmail } = useAuthStore.getState();
      const data = await newAddEmail({
        mobileNumber: mobileNumber as string,
        email: email.trim(),
      });

      setIsLoading(false);
      
      // Show success message and navigate to main app
      Alert.alert(
        'Email Added Successfully',
        'Your email has been added to your account. You can now use it for login and password recovery.',
        [
          {
            text: 'Continue to App',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add email. Please try again.');
    }
  };

  const handleSkipEmail = () => {
    Alert.alert(
      'Skip Email Verification',
      'You can always add an email later for password recovery and notifications. Are you sure you want to skip?',
      [
        {
          text: 'Skip for Now',
          onPress: () => router.replace('/(tabs)/home'),
        },
        {
          text: 'Add Email',
          style: 'cancel',
        },
      ]
    );
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

              {/* Email Verification Form */}
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
                  <Text style={styles.formTitle}>Add Your Email (Optional)</Text>
                  <Text style={styles.formSubtitle}>
                    Add an email address for password recovery and important notifications
                  </Text>

                  {/* Success Icon */}
                  <View style={styles.successIconContainer}>
                    <View style={styles.successIcon}>
                      <Ionicons name="checkmark" size={32} color={colors.text.white} />
                    </View>
                    <Text style={styles.successText}>Account Created Successfully!</Text>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        isFocused && styles.textInputFocused,
                      ]}
                      placeholder="Enter your email address"
                      placeholderTextColor={colors.text.muted}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={styles.inputHint}>
                      We'll send you a verification email
                    </Text>
                  </View>

                  {/* Benefits of Adding Email */}
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsTitle}>Why add an email?</Text>
                    <View style={styles.benefitItem}>
                      <Ionicons name="key" size={16} color={colors.primary[400]} />
                      <Text style={styles.benefitText}>Password recovery</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="notifications" size={16} color={colors.primary[400]} />
                      <Text style={styles.benefitText}>Important updates</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.primary[400]} />
                      <Text style={styles.benefitText}>Enhanced security</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.buttonContainer}>
                    <Button
                      title={isLoading ? "Adding Email..." : "Add Email"}
                      onPress={handleAddEmail}
                      variant="primary"
                      size="large"
                      disabled={!isValid || isLoading}
                      style={styles.addEmailButton}
                      loading={isLoading}
                    />

                    <Button
                      title="Skip for Now"
                      onPress={handleSkipEmail}
                      variant="secondary"
                      size="large"
                      style={styles.skipButton}
                    />
                  </View>

                  <Text style={styles.helpText}>
                    You can always add or change your email in settings later
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
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    ...shadows.glass,
  },
  successText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.success[500],
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing[6],
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
  benefitsContainer: {
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  benefitText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing[2],
    fontFamily: typography.fontFamily.regular,
  },
  buttonContainer: {
    marginBottom: spacing[4],
  },
  addEmailButton: {
    marginBottom: spacing[3],
  },
  skipButton: {
    marginBottom: spacing[3],
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
});
