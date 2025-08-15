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

import { useTransactionsStore } from '../../stores/transactions.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useAuthStore } from '../../stores/auth.store';
import { fileUploadService } from '../../services/file-upload.service';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { createEarnTransactionSchema } from '@shared/schemas';
import { FileUpload, DatePicker, Input } from '../../components/common';

type EarnFormData = z.infer<typeof createEarnTransactionSchema>;

export default function EarnCoinsScreen() {
  const router = useRouter();
  const { brandId } = useLocalSearchParams<{ brandId?: string }>();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { submitEarnRequest, isSubmitting, error, clearError } = useTransactionsStore();
  const { brands, fetchBrands, isLoading: brandsLoading } = useBrandsStore();
  const { user } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<EarnFormData>({
    resolver: zodResolver(createEarnTransactionSchema),
    defaultValues: {
      userId: user?.id || '',
      brandId: brandId || '',
      billAmount: 0,
      billDate: new Date(),
      receiptUrl: '',
      notes: '',
    },
    mode: 'onChange',
  });

  const watchedBrandId = watch('brandId');
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

    setIsUploading(true);
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
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: EarnFormData) => {
    try {
      if (!selectedFile) {
        Alert.alert('Error', 'Please select a receipt file');
        return;
      }

      // Upload file first
      const receiptUrl = await uploadFile();
      
      // Update form data with actual receipt URL and convert Date to ISO string
      const submitData = {
        ...data,
        receiptUrl,
        billDate: data.billDate.toISOString(), // Convert Date to ISO string for backend
      };

      const response = await submitEarnRequest(submitData);
      
      Alert.alert(
        'Success!',
        `Earn request submitted successfully! You've earned ${response.data.transaction.coinsEarned} coins.`,
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit earn request');
    }
  };

  const calculateCoinsEarned = (billAmount: number, brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return 0;
    return Math.round((billAmount * brand.earningPercentage) / 100);
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
        <Text style={{ fontSize: 32, fontWeight: '700', marginBottom: spacing[6] }}>Earn Coins</Text>
        
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
            disabled={isUploading}
            loading={isUploading}
          />
        </View>

        {/* Form Fields */}
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: spacing[3] }}>Transaction Details</Text>
          
          {/* Brand Selection */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: spacing[2] }}>Select Brand *</Text>
            <Controller
              control={control}
              name="brandId"
              render={({ field: { onChange, value } }) => (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: spacing[3] }}>
                      {brands.map((brand) => (
                        <TouchableOpacity
                          key={brand.id}
                          onPress={() => onChange(brand.id)}
                          style={{
                            padding: spacing[3],
                            borderRadius: borderRadius.md,
                            backgroundColor: value === brand.id ? colors.primary[500] : colors.neutral[100],
                            borderWidth: 2,
                            borderColor: value === brand.id ? colors.primary[500] : colors.neutral[200],
                            minWidth: 80,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            fontSize: 16, fontWeight: '600',
                            color: value === brand.id ? colors.white : colors.neutral[700],
                          }}>
                            {brand.name}
                          </Text>
                          <Text style={{
                            fontSize: 12, fontWeight: '400',
                            color: value === brand.id ? colors.white : colors.neutral[500],
                          }}>
                            {brand.earningPercentage}% back
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {errors.brandId && (
                    <Text style={{ color: colors.error[500], marginTop: spacing[1], fontSize: 14 }}>
                      {errors.brandId.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Bill Amount */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: spacing[2] }}>Bill Amount (₹) *</Text>
            <Controller
              control={control}
              name="billAmount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: errors.billAmount ? colors.error[500] : colors.neutral[300],
                    borderRadius: borderRadius.md,
                    padding: spacing[3],
                    fontSize: 16,
                    backgroundColor: colors.white,
                  }}
                  placeholder="Enter bill amount"
                  keyboardType="numeric"
                  value={value ? value.toString() : ''}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                />
              )}
            />
            {errors.billAmount && (
              <Text style={{ color: colors.error[500], marginTop: spacing[1], fontSize: 14 }}>
                {errors.billAmount.message}
              </Text>
            )}
          </View>

          {/* Bill Date */}
          <View style={{ marginBottom: spacing[4] }}>
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

          {/* Notes */}
          <View style={{ marginBottom: spacing[4] }}>
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
                    padding: spacing[3],
                    fontSize: 16,
                    backgroundColor: colors.white,
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
            {errors.notes && (
              <Text style={{ color: colors.error[500], marginTop: spacing[1], fontSize: 14 }}>
                {errors.notes.message}
              </Text>
            )}
          </View>

          {/* Coins Preview */}
          {watchedBrandId && selectedBrand && (
            <View style={{
              backgroundColor: colors.success[50],
              padding: spacing[4],
              borderRadius: borderRadius.md,
              borderLeftWidth: 4,
              borderLeftColor: colors.success[500],
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.success[700], marginBottom: spacing[2] }}>
                You'll Earn
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.success[600] }}>
                {calculateCoinsEarned(watch('billAmount') || 0, watchedBrandId)} Coins
              </Text>
              <Text style={{ fontSize: 14, color: colors.success[600] }}>
                Based on {selectedBrand.earningPercentage}% of ₹{watch('billAmount') || 0}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting || isUploading || !selectedFile}
          style={{
            backgroundColor: (!isValid || isSubmitting || isUploading || !selectedFile) 
              ? colors.neutral[300] 
              : colors.primary[500],
            padding: spacing[4],
            borderRadius: borderRadius.md,
            alignItems: 'center',
          }}
        >
          {isSubmitting || isUploading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {isUploading ? 'Uploading...' : 'Submit Earn Request'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Error Display */}
        {error && (
          <View style={{
            backgroundColor: colors.error[50],
            padding: spacing[3],
            borderRadius: 8,
            marginTop: spacing[4],
            borderLeftWidth: 4,
            borderLeftColor: colors.error[500],
          }}>
            <Text style={{ color: colors.error[700], ...typography.body }}>
              {error}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
