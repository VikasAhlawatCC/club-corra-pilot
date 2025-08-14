import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTransactionsStore } from '../../stores/transactions.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useAuthStore } from '../../stores/auth.store';
import { useCoinsStore } from '../../stores/coins.store';
import { colors, typography, spacing } from '../../styles/theme';
import { createRedeemTransactionSchema } from '@shared/schemas';

type RedeemFormData = z.infer<typeof createRedeemTransactionSchema>;

export default function RedeemCoinsScreen() {
  const router = useRouter();
  
  const { submitRedeemRequest, isSubmitting, error, clearError } = useTransactionsStore();
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { user } = useAuthStore();
  const { balance } = useCoinsStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<RedeemFormData>({
    resolver: zodResolver(createRedeemTransactionSchema),
    defaultValues: {
      userId: user?.id || '',
      brandId: '',
      billAmount: 0,
      billDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      coinsToRedeem: 0,
      notes: '',
    },
    mode: 'onChange',
  });

  const watchedBrandId = watch('brandId');
  const watchedCoinsToRedeem = watch('coinsToRedeem');
  const selectedBrand = brands.find(b => b.id === watchedBrandId);

  // Fetch brands on mount
  React.useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: RedeemFormData) => {
    try {
      const response = await submitRedeemRequest(data);
      
      Alert.alert(
        'Success!',
        `Redeem request submitted successfully! You'll save ₹${response.data.transaction.coinsRedeemed} on your bill.`,
        [
          {
            text: 'View Transaction',
            onPress: () => router.push(`/transactions/${response.data.transaction.id}`),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );

      // Reset form
      reset();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit redeem request');
    }
  };

  const calculateDiscountAmount = (coinsToRedeem: number, brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return 0;
    return Math.round((coinsToRedeem * brand.redemptionPercentage) / 100);
  };

  if (brandsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, ...typography.body }}>Loading brands...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={{ ...typography.h1, marginBottom: spacing.lg }}>
          Redeem Coins
        </Text>
        
        <Text style={{ ...typography.body, marginBottom: spacing.lg, color: colors.textSecondary }}>
          Use your Corra coins to get discounts on your bills.
        </Text>

        {/* Current Balance Display */}
        <View style={{ 
          backgroundColor: colors.primary[100], 
          padding: spacing[4], 
          borderRadius: borderRadius.md, 
          marginBottom: spacing[6] 
        }}>
          <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold, marginBottom: spacing[2] }}>
            Current Coin Balance
          </Text>
          <Text style={{ fontSize: typography.fontSize['2xl'], color: colors.primary[500] }}>
            {balance?.balance || 0} coins
          </Text>
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, marginBottom: spacing[2] }}>Select Brand *</Text>
          <Controller
            control={control}
            name="brandId"
            render={({ field: { onChange, value } }) => (
              <View style={{ borderWidth: 1, borderColor: colors.neutral[300], borderRadius: borderRadius.md }}>
                {brands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={{
                      padding: spacing[4],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.neutral[300],
                      backgroundColor: value === brand.id ? colors.primary[100] : 'transparent',
                    }}
                    onPress={() => onChange(brand.id)}
                  >
                    <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semiBold }}>{brand.name}</Text>
                    <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {brand.redemptionPercentage}% redemption rate
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.brandId && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: typography.fontSize.sm }}>
              {errors.brandId.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, marginBottom: spacing[2] }}>Bill Amount *</Text>
          <Controller
            control={control}
            name="billAmount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  borderRadius: borderRadius.md,
                  padding: spacing[4],
                  fontSize: typography.fontSize.md,
                }}
                placeholder="Enter bill amount"
                keyboardType="numeric"
                value={value.toString()}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
              />
            )}
          />
          {errors.billAmount && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: typography.fontSize.sm }}>
              {errors.billAmount.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.medium, marginBottom: spacing[2] }}>Bill Date *</Text>
          <Controller
            control={control}
            name="billDate"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  borderRadius: borderRadius.md,
                  padding: spacing[4],
                  backgroundColor: colors.background.primary,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.md, color: colors.neutral[700] }}>
                  {value ? new Date(value).toLocaleDateString() : 'Select date'}
                </Text>
              </TouchableOpacity>
            )}
          />
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setValue('billDate', selectedDate.toISOString().split('T')[0]);
                }
              }}
              maximumDate={new Date()}
            />
            )}
          {errors.billDate && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: typography.fontSize.sm }}>
              {errors.billDate.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ ...typography.label, marginBottom: spacing.sm }}>Coins to Redeem *</Text>
          <Controller
            control={control}
            name="coinsToRedeem"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: spacing.md,
                  ...typography.body,
                }}
                placeholder="Enter coins to redeem"
                keyboardType="numeric"
                value={value.toString()}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
              />
            )}
          />
          {errors.coinsToRedeem && (
            <Text style={{ color: colors.error, marginTop: spacing.xs, ...typography.caption }}>
              {errors.coinsToRedeem.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ ...typography.label, marginBottom: spacing.sm }}>Notes (Optional)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: spacing.md,
                  ...typography.body,
                  height: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Add any additional notes..."
                multiline
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {selectedBrand && watchedCoinsToRedeem > 0 && (
          <View style={{ 
            backgroundColor: colors.primaryLight, 
            padding: spacing.md, 
            borderRadius: 8, 
            marginBottom: spacing.lg 
          }}>
            <Text style={{ ...typography.body, fontWeight: '600', marginBottom: spacing.xs }}>
              Estimated Discount
            </Text>
            <Text style={{ ...typography.h2, color: colors.primary }}>
              ₹{calculateDiscountAmount(watchedCoinsToRedeem, watchedBrandId)}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
              Based on {selectedBrand.redemptionPercentage}% of {watchedCoinsToRedeem} coins
            </Text>
          </View>
        )}

        {error && (
          <View style={{ 
            backgroundColor: colors.errorLight, 
            padding: spacing.md, 
            borderRadius: 8, 
            marginBottom: spacing.lg 
          }}>
            <Text style={{ color: colors.error, ...typography.body }}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: isValid ? colors.primary : colors.disabled,
            padding: spacing.md,
            borderRadius: 8,
            alignItems: 'center',
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, ...typography.button }}>
              Submit Redemption Request
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
