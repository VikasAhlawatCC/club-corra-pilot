import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileSetupScreen() {
  const { mobileNumber, email, verificationMethod } = useLocalSearchParams<{ 
    mobileNumber: string; 
    email: string; 
    verificationMethod: string;
  }>();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { updateProfile } = useAuthStore();

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter both your first name and last name');
      return;
    }
    
    if (!mobileNumber || !email) {
      Alert.alert('Error', 'Required information missing. Please start registration again.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update profile with user information
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber,
        email
      });
      
      // Navigate to password setup with all collected information
      router.push({
        pathname: '/auth/password-setup',
        params: { 
          mobileNumber,
          email,
          verificationMethod,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        }
      });
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        Alert.alert('Profile Update Failed', error.message);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
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

          {/* Profile Setup Form */}
          <Card variant="elevated" padding={8} style={styles.formCard}>
            <Text style={styles.formTitle}>Complete Your Profile</Text>
            <Text style={styles.formSubtitle}>
              Tell us a bit about yourself to personalize your experience
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
              />
            </View>

            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              variant="primary"
              size="large"
              fullWidth
              style={styles.continueButton}
            />
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
  continueButton: {
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[500],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.white,
    marginLeft: spacing[3],
    flex: 1,
    lineHeight: 18,
  },
});
