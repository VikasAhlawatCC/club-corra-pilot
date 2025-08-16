import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { Card, Button } from '@/components/common';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to profile edit screen
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update.');
  };

  const handleChangePassword = () => {
    // TODO: Navigate to password change screen
    Alert.alert('Coming Soon', 'Password change will be available in the next update.');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[colors.background.dark[900], colors.background.dark[800]]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const fullName = user.profile 
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : 'User';

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
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your account</Text>
            </View>

            {/* Profile Card */}
            <Card variant="elevated" padding={8} style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{fullName}</Text>
                  <Text style={styles.profileMobile}>{user.mobileNumber}</Text>
                  <Text style={styles.profileStatus}>
                    Status: {user.status === 'ACTIVE' ? 'Active' : user.status}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Profile Actions */}
            <Card variant="elevated" padding={8} style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              
              <TouchableOpacity 
                style={styles.actionItem}
                onPress={handleEditProfile}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="person-outline" size={24} color={colors.primary[400]} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Edit Profile</Text>
                  <Text style={styles.actionSubtitle}>Update your personal information</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionItem}
                onPress={handleChangePassword}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="lock-closed-outline" size={24} color={colors.primary[400]} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Change Password</Text>
                  <Text style={styles.actionSubtitle}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </Card>

            {/* Logout Button */}
            <Button
              title={isLoading ? "Logging out..." : "Logout"}
              onPress={handleLogout}
              variant="secondary"
              size="large"
              disabled={isLoading}
              style={styles.logoutButton}
              loading={isLoading}
            />
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
    paddingBottom: spacing[6],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    marginBottom: spacing[6],
    ...shadows.glass,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  avatarContainer: {
    marginRight: spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  profileMobile: {
    fontSize: typography.fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing[1],
  },
  profileStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.medium,
  },
  actionsCard: {
    backgroundColor: glassEffects.card.backgroundColor,
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    marginBottom: spacing[6],
    ...shadows.glass,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.input,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  logoutButton: {
    marginTop: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.muted,
  },
});
