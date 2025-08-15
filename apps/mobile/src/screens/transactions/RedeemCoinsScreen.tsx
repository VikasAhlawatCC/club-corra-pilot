import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTransactionsStore } from '../../stores/transactions.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useAuthStore } from '../../stores/auth.store';
import { useCoinsStore } from '../../stores/coins.store';
import { fileUploadService } from '../../services/file-upload.service';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
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
  const { user } = useAuthStore();
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

  // Custom validation to include file selection
  const isFormValid = isValid && selectedFile;

  const watchedBrandId = watch('brandId');
  const watchedCoinsToRedeem = watch('coinsToRedeem');
  const selectedBrand = brands.find(b => b.id === watchedBrandId);

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
        billDate: data.billDate.toISOString(), // Convert Date to ISO string for backend
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
    if (!brand) return 0;
    return Math.min(
      brand.maxRedemptionAmount,
      brand.brandwiseMaxCap,
      Math.floor((balance * brand.redemptionPercentage) / 100)
    );
  };

  if (brandsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={{ marginTop: spacing[4], fontSize: 16, fontWeight: '400' }}>Loading brands...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <View style={{ padding: spacing[4] }}>
        <Text style={{ fontSize: 32, fontWeight: '700', marginBottom: spacing[6] }}>
          Redeem Coins
        </Text>
        
        <Text style={{ fontSize: 16, marginBottom: spacing[6], color: colors.text.secondary }}>
          Use your Corra coins to get discounts on your bills.
        </Text>

        {/* File Upload Section */}
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: spacing[3] }}>Upload Receipt</Text>
          
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
        <View style={{ 
          backgroundColor: colors.primary[100], 
          padding: spacing[4], 
          borderRadius: borderRadius.md, 
          marginBottom: spacing[6] 
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: spacing[2] }}>
            Current Coin Balance
          </Text>
          <Text style={{ fontSize: 24, color: colors.primary[500] }}>
            {balance?.balance || 0} coins
          </Text>
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Select Brand *</Text>
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
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{brand.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                      {brand.redemptionPercentage}% redemption rate
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.brandId && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: 14 }}>
              {errors.brandId.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Bill Amount *</Text>
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
                  fontSize: 16,
                }}
                placeholder="Enter bill amount"
                keyboardType="numeric"
                value={value.toString()}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
              />
            )}
          />
          {errors.billAmount && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: 14 }}>
              {errors.billAmount.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Bill Date *</Text>
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

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Coins to Redeem *</Text>
          
          {selectedBrand && (
            <View style={{ marginBottom: spacing[3] }}>
              <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: spacing[2] }}>
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
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[2] }}>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  Min: {selectedBrand.minRedemptionAmount}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  Max: {Math.min(selectedBrand.maxRedemptionAmount, selectedBrand.brandwiseMaxCap)}
                </Text>
              </View>
            </View>
          )}
          
          {errors.coinsToRedeem && (
            <Text style={{ color: colors.error[500], marginTop: spacing[2], fontSize: 14 }}>
              {errors.coinsToRedeem.message}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Notes (Optional)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutral[300],
                  borderRadius: borderRadius.md,
                  padding: spacing[4],
                  fontSize: 16,
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
            backgroundColor: colors.success[50], 
            padding: spacing[4], 
            borderRadius: borderRadius.md, 
            marginBottom: spacing[6],
            borderLeftWidth: 4,
            borderLeftColor: colors.success[500],
          }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.success[700], marginBottom: spacing[2] }}>
              Estimated Discount
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.success[600] }}>
              ₹{calculateDiscountAmount(watchedCoinsToRedeem, watchedBrandId)}
            </Text>
            <Text style={{ fontSize: 14, color: colors.success[600] }}>
              Based on {selectedBrand.redemptionPercentage}% of {watchedCoinsToRedeem} coins
            </Text>
          </View>
        )}

        {error && (
          <View style={{
            backgroundColor: colors.error[50],
            padding: spacing[3],
            borderRadius: borderRadius.md,
            marginBottom: spacing[4],
            borderLeftWidth: 4,
            borderLeftColor: colors.error[500],
          }}>
            <Text style={{ color: colors.error[700], fontSize: 16 }}>
              {error}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!isFormValid || isSubmitting || !selectedFile}
          style={{
            backgroundColor: (!isFormValid || isSubmitting || !selectedFile) 
              ? colors.neutral[300] 
              : colors.primary[500],
            padding: spacing[4],
            borderRadius: borderRadius.md,
            alignItems: 'center',
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              Submit Redemption Request
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
