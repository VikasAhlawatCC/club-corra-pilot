import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTransactionsStore } from '../../stores/transactions.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useAuthStore } from '../../stores/auth.store';
import { useCoinsStore } from '../../stores/coins.store';
import { fileUploadService } from '../../services/file-upload.service';
import { colors, typography, spacing, borderRadius, shadows, glassEffects } from '../../styles/theme';
import { createRedeemTransactionSchema } from '@shared/schemas';
import { FileUpload, DatePicker, Input, Slider } from '../../components/common';

type RedeemFormData = z.infer<typeof createRedeemTransactionSchema>;

export default function RedeemCoinsScreen() {
  const router = useRouter();
  const { brandId } = useLocalSearchParams<{ brandId?: string }>();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { submitRedeemRequest, isSubmitting, error, clearError } = useTransactionsStore();
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useCoinsStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
  } = useForm<RedeemFormData>({
    resolver: zodResolver(createRedeemTransactionSchema),
    defaultValues: {
      userId: user?.id || '',
      brandId: brandId || '',
      billAmount: 0,
      billDate: new Date(),
      coinsToRedeem: 0,
      notes: '',
    },
    mode: 'onChange',
  });



  const watchedBrandId = watch('brandId');
  const watchedCoinsToRedeem = watch('coinsToRedeem');
  const watchedBillAmount = watch('billAmount');
  const selectedBrand = brands.find(b => b.id === watchedBrandId);

  // Check if form is ready to submit
  const isFormReady = watchedBrandId && watchedBillAmount > 0 && watchedCoinsToRedeem > 0 && selectedFile && !isSubmitting;

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Set brandId from params when available
  useEffect(() => {
    if (brandId) {
      setValue('brandId', brandId);
    }
  }, [brandId, setValue]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: RedeemFormData) => {
    try {
      if (!selectedFile) {
        Alert.alert('Error', 'Please select a receipt file');
        return;
      }

      // Upload file first
      const receiptUrl = await uploadFile();
      
      // Update form data with actual receipt URL
      const submitData = {
        ...data,
        receiptUrl,
        billDate: data.billDate, // Keep as Date object for backend
      };

      const response = await submitRedeemRequest(submitData);
      
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

      // Reset form and image
      reset();
      setSelectedFile(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit redeem request');
    }
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const uploadFile = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }

    try {
      // Get upload URL from backend
      const uploadUrl = await fileUploadService.getUploadUrl({
        fileName: selectedFile.name || `receipt_${Date.now()}.${selectedFile.type === 'application/pdf' ? 'pdf' : 'jpg'}`,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      // Convert file to blob for upload
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();

      // Upload to S3
      await fileUploadService.uploadFileToS3(uploadUrl.uploadUrl, blob);

      // Confirm upload with backend
      await fileUploadService.confirmUpload({
        fileKey: uploadUrl.fileKey,
        fileUrl: uploadUrl.fileKey, // Use fileKey as URL for now
      });

      return uploadUrl.fileKey;
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateDiscountAmount = (coinsToRedeem: number, brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return 0;
    return Math.round((coinsToRedeem * brand.redemptionPercentage) / 100);
  };

  const getMaxRedeemable = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand || !balance) return 0;
    return Math.min(
      brand.maxRedemptionAmount,
      brand.brandwiseMaxCap,
      Math.floor((balance.balance * brand.redemptionPercentage) / 100)
    );
  };

  if (brandsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold[500]} />
        <Text style={styles.loadingText}>Loading brands...</Text>
      </View>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="lock-closed" size={64} color={colors.error[500]} />
        <Text style={[styles.loadingText, { marginTop: spacing[4] }]}>
          Please log in to access this feature
        </Text>
        <TouchableOpacity
          style={[styles.submitButton, { marginTop: spacing[4] }]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.submitButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Redeem Coins</Text>
          <Text style={styles.subtitle}>
            Redeem your Corra coins for discounts on your next purchase
          </Text>
          
          {/* Authentication Status */}
          <View style={styles.authStatus}>
            <Ionicons 
              name={isAuthenticated ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={isAuthenticated ? colors.success[500] : colors.error[500]} 
            />
            <Text style={[
              styles.authStatusText,
              { color: isAuthenticated ? colors.success[500] : colors.error[500] }
            ]}>
              {isAuthenticated ? `Logged in as ${user?.mobileNumber || 'User'}` : 'Not logged in'}
            </Text>
          </View>
        </View>

        {/* File Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Receipt</Text>
          <Text style={styles.sectionDescription}>
            Take a clear photo or upload your receipt to redeem coins
          </Text>
          
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            label="Receipt File"
            placeholder="Tap to select receipt file"
            acceptTypes={['image', 'pdf']}
            maxSize={5}
            disabled={false}
            loading={false}
          />
        </View>

        {/* Current Balance Display */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={24} color={colors.gold[500]} />
            <Text style={styles.balanceTitle}>Current Coin Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {balance?.balance || 0} coins
          </Text>
        </View>

        {/* Brand Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Brand</Text>
          <Text style={styles.sectionDescription}>
            Choose the brand where you want to redeem your coins
          </Text>
          
          <Controller
            control={control}
            name="brandId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.brandSelectionContainer}>
                {brands.map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.brandSelectionCard,
                      value === brand.id && styles.brandSelectionCardSelected
                    ]}
                    onPress={() => onChange(brand.id)}
                  >
                    <View style={styles.brandSelectionContent}>
                      <Text style={[
                        styles.brandSelectionName,
                        value === brand.id && styles.brandSelectionNameSelected
                      ]}>
                        {brand.name}
                      </Text>
                      <Text style={[
                        styles.brandSelectionRate,
                        value === brand.id && styles.brandSelectionRateSelected
                      ]}>
                        {brand.redemptionPercentage}% redemption rate
                      </Text>
                    </View>
                    {value === brand.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.gold[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.brandId && (
            <Text style={styles.errorText}>
              {errors.brandId.message}
            </Text>
          )}
        </View>

        {/* Bill Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bill Amount (₹) *</Text>
            <Controller
              control={control}
              name="billAmount"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.billAmount && styles.textInputError
                    ]}
                    placeholder="Enter bill amount"
                    placeholderTextColor={colors.text.placeholder}
                    keyboardType="numeric"
                    value={value.toString()}
                    onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  />
                </View>
              )}
            />
            {errors.billAmount && (
              <Text style={styles.errorText}>
                {errors.billAmount.message}
              </Text>
            )}
          </View>

          {/* Bill Date */}
          <View style={styles.fieldContainer}>
            <Controller
              control={control}
              name="billDate"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  value={value}
                  onDateChange={onChange}
                  label="Bill Date *"
                  placeholder="Select bill date"
                  maximumDate={new Date()}
                  error={errors.billDate?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Coins to Redeem */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coins to Redeem</Text>
          
          {selectedBrand && (
            <View style={styles.coinsRedeemContainer}>
              <Text style={styles.coinsRedeemDescription}>
                Select amount between {selectedBrand.minRedemptionAmount} and {Math.min(selectedBrand.maxRedemptionAmount, selectedBrand.brandwiseMaxCap)} coins
              </Text>
              
              <Controller
                control={control}
                name="coinsToRedeem"
                render={({ field: { onChange, value } }) => (
                  <Slider
                    value={value || selectedBrand.minRedemptionAmount}
                    onValueChange={onChange}
                    minimumValue={selectedBrand.minRedemptionAmount}
                    maximumValue={Math.min(selectedBrand.maxRedemptionAmount, selectedBrand.brandwiseMaxCap)}
                    step={1}
                    label="Coins to Redeem"
                    valueLabel={`${Math.round(value || selectedBrand.minRedemptionAmount)} coins`}
                  />
                )}
              />
              
              <View style={styles.coinsRedeemLimits}>
                <Text style={styles.coinsRedeemLimit}>
                  Min: {selectedBrand.minRedemptionAmount}
                </Text>
                <Text style={styles.coinsRedeemLimit}>
                  Max: {Math.min(selectedBrand.maxRedemptionAmount, selectedBrand.brandwiseMaxCap)}
                </Text>
              </View>
            </View>
          )}
          
          {errors.coinsToRedeem && (
            <Text style={styles.errorText}>
              {errors.coinsToRedeem.message}
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.sectionDescription}>
            Add any additional information about your redemption request
          </Text>
          
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.textArea,
                  errors.notes && styles.textInputError
                ]}
                placeholder="Add any additional notes..."
                placeholderTextColor={colors.text.placeholder}
                multiline
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {/* Discount Preview */}
        {selectedBrand && watchedCoinsToRedeem > 0 && (
          <View style={styles.discountPreview}>
            <View style={styles.discountPreviewHeader}>
              <Ionicons name="pricetag" size={24} color={colors.success[500]} />
              <Text style={styles.discountPreviewTitle}>Estimated Discount</Text>
            </View>
            <Text style={styles.discountAmount}>
              ₹{calculateDiscountAmount(watchedCoinsToRedeem, watchedBrandId)}
            </Text>
            <Text style={styles.discountDescription}>
              Based on {selectedBrand.redemptionPercentage}% of {watchedCoinsToRedeem} coins
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
            <Text style={styles.errorMessage}>
              {error}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!isFormReady}
          style={[
            styles.submitButton,
            (!isFormReady) && styles.submitButtonDisabled
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>
                Submit Redemption Request
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark[900],
    paddingTop: spacing[6], // Added top margin
  },
  content: {
    padding: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark[900],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  headerSection: {
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  authStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.input,
  },
  authStatusText: {
    marginLeft: spacing[2],
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  balanceContainer: {
    backgroundColor: colors.primary[100],
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[8],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginLeft: spacing[2],
    color: colors.text.dark,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary[500],
  },
  brandSelectionContainer: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  brandSelectionCard: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandSelectionCardSelected: {
    backgroundColor: colors.primary[100],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  brandSelectionContent: {
    flex: 1,
  },
  brandSelectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  brandSelectionNameSelected: {
    color: colors.text.dark,
  },
  brandSelectionRate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  brandSelectionRateSelected: {
    color: colors.text.dark,
  },
  fieldContainer: {
    marginBottom: spacing[5],
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing[2],
  },
  textInput: {
    flex: 1,
    padding: spacing[3],
    fontSize: 16,
    color: colors.text.input,
    backgroundColor: 'transparent',
  },
  textInputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: 16,
    backgroundColor: colors.background.input,
    height: 80,
    textAlignVertical: 'top',
    color: colors.text.input,
  },
  errorText: {
    color: colors.error[500],
    marginTop: spacing[2],
    fontSize: 14,
  },
  coinsRedeemContainer: {
    backgroundColor: colors.background.card,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
    ...shadows.card,
  },
  coinsRedeemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  coinsRedeemLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  coinsRedeemLimit: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  discountPreview: {
    backgroundColor: colors.success[50],
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[6],
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
  },
  discountPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  discountPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success[700],
    marginLeft: spacing[2],
  },
  discountAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success[600],
    marginBottom: spacing[2],
  },
  discountDescription: {
    fontSize: 14,
    color: colors.success[600],
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.gold[500],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing[6],
    ...shadows.gold,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
    ...shadows.none,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  errorMessage: {
    color: colors.error[700],
    fontSize: 16,
    flex: 1,
  },
});
