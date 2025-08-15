import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '@/styles/theme';
import { WelcomeBonusAnimation } from '@/components/common';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useBrandsStore } from '@/stores/brands.store';
import { useCoinBalance } from '@/hooks/useCoinBalance';

export default function HomeScreen() {
  const router = useRouter();
  const { shouldShowAnimation, markWelcomeBonusAsShown } = useWelcomeBonus();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { balance, totalEarned, totalRedeemed, refreshBalance, isRefreshing } = useCoinBalance();

  useEffect(() => {
    try {
      if (shouldShowAnimation === true) {
        setShowWelcomeModal(true);
      } else {
        setShowWelcomeModal(false);
      }
    } catch (error) {
      console.error('Error in welcome animation useEffect:', error);
      setShowWelcomeModal(false);
    }
  }, [shouldShowAnimation]);

  // Fetch brands and balance on mount
  useEffect(() => {
    try {
      if (typeof fetchBrands === 'function') {
        fetchBrands();
      }
      if (typeof refreshBalance === 'function') {
        refreshBalance();
      }
    } catch (error) {
      console.error('Error in home screen mount useEffect:', error);
    }
  }, [fetchBrands, refreshBalance]);

  const handleEarnCoins = () => {
    try {
      router.push('/transactions/earn');
    } catch (error) {
      console.error('Error navigating to earn coins:', error);
    }
  };

  const handleRedeemCoins = () => {
    try {
      router.push('/transactions/redeem');
    } catch (error) {
      console.error('Error navigating to redeem coins:', error);
    }
  };

  const handleBrandPress = (brand: any) => {
    try {
      if (brand?.id) {
        router.push(`/brands/${brand.id}`);
      } else {
        console.warn('Brand object is missing ID:', brand);
      }
    } catch (error) {
      console.error('Error navigating to brand:', error);
    }
  };

  const handleWelcomeAnimationComplete = () => {
    try {
      // Mark welcome bonus as shown and close modal
      markWelcomeBonusAsShown();
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Error handling welcome animation complete:', error);
      setShowWelcomeModal(false);
    }
  };

  // Use real brands from API with safety checks
  const partnerBrands = Array.isArray(brands) ? brands.filter(brand => brand?.isActive === true) : [];

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshBalance}
              colors={[colors.gold[500]]}
              tintColor={colors.gold[500]}
            />
          }
        >
          {/* Elite Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>CC</Text>
              </View>
              <View style={styles.appNameContainer}>
                <Text style={styles.appName}>Club Corra</Text>
              </View>
            </View>
          </View>

          {/* Wallet Balance Section */}
          <View style={styles.walletSection}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Your Balance</Text>
                <Ionicons name="wallet" size={24} color={colors.gold[700]} />
              </View>
              <Text style={styles.balanceAmount}>{balance || 0}</Text>
              <Text style={styles.balanceCurrency}>Corra Coins</Text>
              <View style={styles.balanceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalEarned || 0}</Text>
                  <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalRedeemed || 0}</Text>
                  <Text style={styles.statLabel}>Total Redeemed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleEarnCoins}
                activeOpacity={0.8}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="add-circle" size={32} color={colors.gold[700]} />
                </View>
                <Text style={styles.actionText}>Earn Coins</Text>
                <Text style={styles.actionSubtext}>Upload bills to earn</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={handleRedeemCoins}
                activeOpacity={0.8}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="gift" size={32} color={colors.gold[700]} />
                </View>
                <Text style={styles.actionText}>Redeem</Text>
                <Text style={styles.actionSubtext}>Convert to cashback</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Partner Brands Section */}
          <View style={styles.brandsSection}>
            <Text style={styles.sectionTitle}>Partner Brands</Text>
            <Text style={styles.sectionSubtitle}>Tap to earn or redeem coins</Text>
            
            {brandsLoading ? (
              <View style={styles.brandsLoading}>
                <ActivityIndicator size="large" color={colors.gold[500]} />
                <Text style={styles.brandsLoadingText}>Loading brands...</Text>
              </View>
            ) : partnerBrands.length === 0 ? (
              <View style={styles.brandsEmpty}>
                <Ionicons name="storefront-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.brandsEmptyText}>No brands available</Text>
                <Text style={styles.brandsEmptySubtext}>Check back later for partner brands</Text>
              </View>
            ) : (
              <View style={styles.brandsGrid}>
                {partnerBrands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.brandCard}
                  onPress={() => handleBrandPress(brand)}
                  activeOpacity={0.8}
                >
                  {brand.logoUrl ? (
                    <Image source={{ uri: brand.logoUrl }} style={styles.brandLogo} />
                  ) : (
                    <View style={styles.brandIcon}>
                      <Text style={styles.brandInitial}>{brand.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <View style={styles.brandInfo}>
                    <Text style={styles.brandPercentage}>{brand.earningPercentage}% earn</Text>
                    <Text style={styles.brandPercentage}>{brand.redemptionPercentage}% redeem</Text>
                  </View>
                </TouchableOpacity>
              ))}
              </View>
            )}
          </View>

          {/* Welcome Bonus Section - Only show if animation hasn't been shown */}
          {!shouldShowAnimation && (
            <View style={styles.bonusSection}>
              <View style={styles.bonusCard}>
                <View style={styles.bonusIcon}>
                  <Ionicons name="star" size={32} color={colors.gold[700]} />
                </View>
                <Text style={styles.bonusTitle}>🎉 Welcome Bonus!</Text>
                <Text style={styles.bonusDescription}>
                  You've earned 100 coins for joining Club Corra. Start earning more by uploading your first bill!
                </Text>
                <TouchableOpacity 
                  style={styles.bonusButton}
                  onPress={handleEarnCoins}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bonusButtonText}>Upload Bill</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Welcome Bonus Animation Modal */}
        <Modal
          visible={showWelcomeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWelcomeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <WelcomeBonusAnimation
                isVisible={showWelcomeModal}
                onAnimationComplete={handleWelcomeAnimationComplete}
              />
            </View>
          </View>
        </Modal>
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
    paddingBottom: spacing[20],
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
    ...shadows.glass,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  appNameContainer: {
    flex: 1,
  },
  appName: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  tagline: {
    fontSize: typography.fontSize.md,
    color: colors.text.gold,
    fontFamily: typography.fontFamily.medium,
  },

  // Wallet Section
  walletSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  balanceCard: {
    backgroundColor: glassEffects.card.backgroundColor,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  balanceLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginRight: spacing[3],
  },
  balanceAmount: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.gold,
    marginBottom: spacing[1],
    ...shadows.gold,
  },
  balanceCurrency: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[4],
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.text.muted,
    opacity: 0.3,
    marginHorizontal: spacing[4],
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[4],
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  actionCard: {
    flex: 1,
    backgroundColor: glassEffects.primary.backgroundColor,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: glassEffects.primary.borderColor,
    ...shadows.md,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: glassEffects.white.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: glassEffects.white.borderColor,
  },
  actionText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },

  // Brands Section
  brandsSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  brandCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.primary[400],
  },
  brandInitial: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.white,
  },
  brandName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  brandInfo: {
    alignItems: 'center',
  },
  brandPercentage: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[1],
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    marginBottom: spacing[2],
    ...shadows.md,
  },
  brandsLoading: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  brandsLoadingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing[3],
    fontFamily: typography.fontFamily.medium,
  },
  brandsEmpty: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  brandsEmptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing[3],
    fontFamily: typography.fontFamily.medium,
  },
  brandsEmptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
    fontFamily: typography.fontFamily.regular,
  },

  // Bonus Section
  bonusSection: {
    paddingHorizontal: spacing[6],
  },
  bonusCard: {
    backgroundColor: glassEffects.card.backgroundColor,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: glassEffects.card.borderColor,
    ...shadows.glass,
    alignItems: 'center',
  },
  bonusIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    ...shadows.gold,
  },
  bonusTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  bonusDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 22,
    fontFamily: typography.fontFamily.medium,
  },
  bonusButton: {
    backgroundColor: colors.gold[700],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    ...shadows.gold,
  },
  bonusButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.dark,
    fontFamily: typography.fontFamily.semiBold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

