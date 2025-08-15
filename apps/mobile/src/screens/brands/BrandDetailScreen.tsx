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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useBrandsStore } from '../../stores/brands.store';
import { useCoinsStore } from '../../stores/coins.store';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';

export default function BrandDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedAction, setSelectedAction] = useState<'earn' | 'redeem' | null>(null);
  
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { balance } = useCoinsStore();

  const brand = brands.find(b => b.id === id);

  useEffect(() => {
    if (!brands.length) {
      fetchBrands();
    }
  }, [brands.length, fetchBrands]);

  const handleActionSelect = (action: 'earn' | 'redeem') => {
    setSelectedAction(action);
    
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
  };

  const handleBack = () => {
    router.back();
  };

  if (brandsLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold[500]} />
        <Text style={styles.loadingText}>Loading brand details...</Text>
      </SafeAreaView>
    );
  }

  if (!brand) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error[500]} />
        <Text style={styles.errorTitle}>Brand Not Found</Text>
        <Text style={styles.errorMessage}>The brand you're looking for doesn't exist.</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const maxRedeemable = Math.min(
    brand.maxRedemptionAmount,
    brand.brandwiseMaxCap,
    Math.floor((balance * brand.redemptionPercentage) / 100)
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Brand Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Brand Card */}
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

          {/* Brand Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={colors.success[500]} />
              <Text style={styles.statValue}>{brand.earningPercentage}%</Text>
              <Text style={styles.statLabel}>Earning Rate</Text>
              <Text style={styles.statDescription}>
                Earn {brand.earningPercentage}% of your bill amount in Corra Coins
              </Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="gift" size={24} color={colors.gold[500]} />
              <Text style={styles.statValue}>{brand.redemptionPercentage}%</Text>
              <Text style={styles.statLabel}>Redemption Rate</Text>
              <Text style={styles.statDescription}>
                Redeem coins for {brand.redemptionPercentage}% cashback on your bill
              </Text>
            </View>
          </View>

          {/* Action Selection */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
            
            <View style={styles.actionCards}>
              <TouchableOpacity
                style={[styles.actionCard, selectedAction === 'earn' && styles.actionCardSelected]}
                onPress={() => handleActionSelect('earn')}
                activeOpacity={0.8}
              >
                <View style={styles.actionIcon}>
                  <Ionicons 
                    name="add-circle" 
                    size={32} 
                    color={selectedAction === 'earn' ? colors.white : colors.success[500]} 
                  />
                </View>
                <Text style={[styles.actionTitle, selectedAction === 'earn' && styles.actionTitleSelected]}>
                  Earn Coins
                </Text>
                <Text style={[styles.actionDescription, selectedAction === 'earn' && styles.actionDescriptionSelected]}>
                  Upload your receipt to earn {brand.earningPercentage}% of your bill amount
                </Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>Recommended</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionCard, 
                  selectedAction === 'redeem' && styles.actionCardSelected,
                  balance < brand.minRedemptionAmount && styles.actionCardDisabled
                ]}
                onPress={() => handleActionSelect('redeem')}
                activeOpacity={0.8}
                disabled={balance < brand.minRedemptionAmount}
              >
                <View style={styles.actionIcon}>
                  <Ionicons 
                    name="gift" 
                    size={32} 
                    color={
                      selectedAction === 'redeem' 
                        ? colors.white 
                        : balance < brand.minRedemptionAmount 
                          ? colors.gray[400] 
                          : colors.gold[500]
                    } 
                  />
                </View>
                <Text style={[
                  styles.actionTitle, 
                  selectedAction === 'redeem' && styles.actionTitleSelected,
                  balance < brand.minRedemptionAmount && styles.actionTitleDisabled
                ]}>
                  Redeem Coins
                </Text>
                <Text style={[
                  styles.actionDescription, 
                  selectedAction === 'redeem' && styles.actionDescriptionSelected,
                  balance < brand.minRedemptionAmount && styles.actionDescriptionDisabled
                ]}>
                  Use your coins for cashback on your bill
                </Text>
                
                {balance < brand.minRedemptionAmount ? (
                  <View style={styles.actionBadgeDisabled}>
                    <Text style={styles.actionBadgeTextDisabled}>
                      Need {brand.minRedemptionAmount - balance} more coins
                    </Text>
                  </View>
                ) : (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>
                      Up to {maxRedeemable} coins
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Info */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Your Current Balance</Text>
              <Text style={styles.balanceAmount}>{balance}</Text>
              <Text style={styles.balanceCurrency}>Corra Coins</Text>
              
              {balance < brand.minRedemptionAmount && (
                <View style={styles.balanceWarning}>
                  <Ionicons name="information-circle" size={16} color={colors.warning[500]} />
                  <Text style={styles.balanceWarningText}>
                    You need at least {brand.minRedemptionAmount} coins to redeem from this brand
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Redemption Limits */}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark[900],
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark[900],
    padding: spacing[6],
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  brandCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    marginBottom: spacing[6],
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
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.card,
  },
  actionCardSelected: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  actionCardDisabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
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
  },
  actionBadgeText: {
    ...typography.bodySmall,
    color: colors.success[700],
    fontWeight: '600',
  },
  actionBadgeDisabled: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  actionBadgeTextDisabled: {
    ...typography.bodySmall,
    color: colors.warning[700],
    fontWeight: '600',
  },
  balanceSection: {
    marginBottom: spacing[6],
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    ...shadows.card,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing[2],
  },
});
