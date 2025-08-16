import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useBrandsStore } from '../../stores/brands.store';
import { useCoinsStore } from '../../stores/coins.store';
import { colors, spacing, borderRadius, typography, shadows, glassEffects } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function BrandDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { balance: balanceData } = useCoinsStore();
  
  // Extract balance value from the response object
  const balance = balanceData?.balance || 0;

  const brand = brands.find(b => b.id === id);

  useEffect(() => {
    if (!brands.length) {
      fetchBrands();
    }
  }, [brands.length, fetchBrands]);

  const handleActionSelect = async (action: 'earn' | 'redeem') => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    try {
      // Navigate to the appropriate transaction screen
      if (action === 'earn') {
        router.push({
          pathname: '/transactions/earn',
          params: { brandId: id }
        });
      } else {
        router.push({
          pathname: '/transactions/redeem',
          params: { brandId: id }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (brandsLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.background.dark[900], colors.background.dark[800]]}
          style={styles.gradient}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.gold[500]} />
            <Text style={styles.loadingText}>Loading brand details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!brand) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <LinearGradient
          colors={[colors.background.dark[900], colors.background.dark[800]]}
          style={styles.gradient}
        >
          <View style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={64} color={colors.error[500]} />
            </View>
            <Text style={styles.errorTitle}>Brand Not Found</Text>
            <Text style={styles.errorMessage}>The brand you're looking for doesn't exist.</Text>
            <TouchableOpacity style={styles.errorBackButton} onPress={handleBack}>
              <Text style={styles.errorBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const maxRedeemable = Math.min(
    brand.maxRedemptionAmount,
    brand.brandwiseMaxCap,
    Math.floor((balance * brand.redemptionPercentage) / 100)
  );

  const canRedeem = balance >= brand.minRedemptionAmount;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Brand Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Enhanced Brand Card */}
          <View style={styles.brandCard}>
            <View style={styles.brandHeader}>
              {brand.logoUrl ? (
                <Image source={{ uri: brand.logoUrl }} style={styles.brandLogo} />
              ) : (
                <View style={styles.brandLogoPlaceholder}>
                  <Text style={styles.brandInitial}>
                    {brand.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.brandInfo}>
                <Text style={styles.brandName}>{brand.name}</Text>
                <Text style={styles.brandDescription}>{brand.description}</Text>
                {brand.category && (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{brand.category.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Prominent Balance Display */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet" size={24} color={colors.gold[500]} />
                <Text style={styles.balanceTitle}>Your Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>{balance}</Text>
              <Text style={styles.balanceCurrency}>Corra Coins</Text>
              
              {!canRedeem && (
                <View style={styles.balanceWarning}>
                  <Ionicons name="information-circle" size={16} color={colors.warning[500]} />
                  <Text style={styles.balanceWarningText}>
                    Need {brand.minRedemptionAmount - balance} more coins to redeem
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Enhanced Brand Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={24} color={colors.success[500]} />
              </View>
              <Text style={styles.statValue}>{brand.earningPercentage}%</Text>
              <Text style={styles.statLabel}>Earning Rate</Text>
              <Text style={styles.statDescription}>
                Earn {brand.earningPercentage}% of your bill amount
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="gift" size={24} color={colors.gold[500]} />
              </View>
              <Text style={styles.statValue}>{brand.redemptionPercentage}%</Text>
              <Text style={styles.statLabel}>Redemption Rate</Text>
              <Text style={styles.statDescription}>
                Get {brand.redemptionPercentage}% cashback on bills
              </Text>
            </View>
          </View>

          {/* Enhanced Action Section */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Choose Your Action</Text>
            
            <View style={styles.actionCards}>
              {/* Earn Action Card */}
              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardEarn]}
                onPress={() => handleActionSelect('earn')}
                activeOpacity={0.8}
                disabled={isNavigating}
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="add-circle" size={32} color={colors.success[500]} />
                  </View>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>Recommended</Text>
                  </View>
                </View>
                
                <Text style={styles.actionTitle}>Earn Coins</Text>
                <Text style={styles.actionDescription}>
                  Upload your receipt to earn {brand.earningPercentage}% of your bill amount
                </Text>
                
                <View style={styles.actionFooter}>
                  <Text style={styles.actionFooterText}>Tap to continue</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.success[500]} />
                </View>
              </TouchableOpacity>

              {/* Redeem Action Card */}
              <TouchableOpacity
                style={[
                  styles.actionCard, 
                  styles.actionCardRedeem,
                  !canRedeem && styles.actionCardDisabled
                ]}
                onPress={() => handleActionSelect('redeem')}
                activeOpacity={0.8}
                disabled={!canRedeem || isNavigating}
              >
                <View style={styles.actionCardHeader}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons 
                      name="gift" 
                      size={32} 
                      color={canRedeem ? colors.gold[500] : colors.gray[400]} 
                    />
                  </View>
                  {canRedeem ? (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>Available</Text>
                    </View>
                  ) : (
                    <View style={styles.actionBadgeDisabled}>
                      <Text style={styles.actionBadgeTextDisabled}>Locked</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.actionTitle}>Redeem Coins</Text>
                <Text style={styles.actionDescription}>
                  Use your coins for cashback on your bill
                </Text>
                
                {canRedeem ? (
                  <View style={styles.actionFooter}>
                    <Text style={styles.actionFooterText}>Up to {maxRedeemable} coins</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.gold[500]} />
                  </View>
                ) : (
                  <View style={styles.actionFooter}>
                    <Text style={styles.actionFooterTextDisabled}>
                      Need {brand.minRedemptionAmount - balance} more coins
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>



          {/* Enhanced Redemption Limits */}
          <View style={styles.limitsSection}>
            <Text style={styles.sectionTitle}>Redemption Limits</Text>
            <View style={styles.limitsGrid}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Minimum</Text>
                <Text style={styles.limitValue}>{brand.minRedemptionAmount}</Text>
                <Text style={styles.limitUnit}>coins</Text>
              </View>
              <View style={styles.limitDivider} />
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Maximum</Text>
                <Text style={styles.limitValue}>{brand.maxRedemptionAmount}</Text>
                <Text style={styles.limitUnit}>coins</Text>
              </View>
              <View style={styles.limitDivider} />
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Brand Cap</Text>
                <Text style={styles.limitValue}>{brand.brandwiseMaxCap}</Text>
                <Text style={styles.limitUnit}>coins</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.dark[900],
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background.dark[900],
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorIconContainer: {
    marginBottom: spacing[4],
  },
  errorTitle: {
    ...typography.headingMedium,
    color: colors.error[500],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorMessage: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  errorBackButton: {
    backgroundColor: colors.gold[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  errorBackButtonText: {
    ...typography.button,
    color: colors.background.dark[900],
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    backgroundColor: colors.background.dark[900],
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.card.glass,
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.white,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  brandCard: {
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginTop: spacing[6],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.card,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    marginRight: spacing[4],
  },
  brandLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gold[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  brandInitial: {
    ...typography.headingLarge,
    color: colors.gold[600],
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  brandDescription: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  categoryTag: {
    backgroundColor: colors.gold[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.gold[700],
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: spacing[6],
    gap: spacing[4],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.card,
  },
  statValue: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  statDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: colors.white,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  actionCards: {
    gap: spacing[4],
  },
  actionCard: {
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.card,
  },
  actionCardEarn: {
    borderColor: colors.success[500],
    borderWidth: 2,
  },
  actionCardRedeem: {
    borderColor: colors.gold[500],
    borderWidth: 2,
  },
  actionCardSelected: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  actionCardDisabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginBottom: spacing[3],
  },
  actionTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  actionTitleSelected: {
    color: colors.white,
  },
  actionTitleDisabled: {
    color: colors.text.secondary,
  },
  actionDescription: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  actionDescriptionSelected: {
    color: colors.white,
  },
  actionDescriptionDisabled: {
    color: colors.gray[400],
  },
  actionBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  actionBadgeText: {
    ...typography.bodySmall,
    color: colors.success[700],
    fontWeight: '600',
  },
  actionBadgeDisabled: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  actionBadgeTextDisabled: {
    ...typography.bodySmall,
    color: colors.gray[500],
    fontWeight: '600',
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  actionFooterText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  actionFooterTextDisabled: {
    ...typography.bodySmall,
    color: colors.gray[400],
    fontWeight: '500',
  },
  balanceSection: {
    marginBottom: spacing[6],
  },
  balanceCard: {
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    ...shadows.card,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  balanceTitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  balanceAmount: {
    ...typography.headingLarge,
    color: colors.gold[500],
    marginBottom: spacing[1],
  },
  balanceCurrency: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  balanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning[100],
  },
  balanceWarningText: {
    ...typography.bodySmall,
    color: colors.warning[700],
    marginLeft: spacing[2],
    flex: 1,
  },
  limitsSection: {
    marginBottom: spacing[6],
  },
  limitsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.card.primary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.card,
  },
  limitItem: {
    flex: 1,
    alignItems: 'center',
  },
  limitLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  limitValue: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  limitUnit: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  limitDivider: {
    width: 1,
    backgroundColor: colors.border.primary,
    marginHorizontal: spacing[2],
  },
  bottomSpacing: {
    height: spacing[6],
  },
});
