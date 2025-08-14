import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { useTransactionsStore } from '../../stores/transactions.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useAuthStore } from '../../stores/auth.store';
import { fileUploadService } from '../../services/file-upload.service';
import { colors, typography, spacing } from '../../styles/theme';
import { createEarnTransactionSchema } from '@shared/schemas';

type EarnFormData = z.infer<typeof createEarnTransactionSchema>;

export default function EarnCoinsScreen() {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
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
      brandId: '',
      billAmount: 0,
      billDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      receiptUrl: '',
      notes: '',
    },
    mode: 'onChange',
  });

  const watchedBrandId = watch('brandId');
  const selectedBrand = brands.find(b => b.id === watchedBrandId);

  // Fetch brands on mount
  React.useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Clear error when component unmounts
  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateFile = (file: any) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG and PNG files are allowed');
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset);
        
        // Validate file
        try {
          validateFile({
            size: asset.fileSize || 0,
            type: asset.type || 'image/jpeg'
          });
        } catch (validationError) {
          Alert.alert('Invalid File', validationError instanceof Error ? validationError.message : 'File validation failed');
          setSelectedImage(null);
          return;
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedImage) {
      throw new Error('No image selected');
    }

    setIsUploading(true);
    try {
      // Get upload URL from backend
      const uploadUrl = await fileUploadService.getUploadUrl({
        fileName: `receipt_${Date.now()}.jpg`,
        fileType: selectedImage.type || 'image/jpeg',
        fileSize: selectedImage.fileSize || 0,
      });

      // Convert image to blob for upload
      const response = await fetch(selectedImage.uri);
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
      if (!selectedImage) {
        Alert.alert('Error', 'Please select a receipt image');
        return;
      }

      // Upload image first
      const receiptUrl = await uploadImage();
      
      // Update form data with actual receipt URL
      const submitData = {
        ...data,
        receiptUrl,
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
      setSelectedImage(null);
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
        
        {/* Image Upload Section */}
        <View style={{ marginBottom: spacing[6] }}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: spacing[3] }}>Upload Receipt</Text>
          
          <TouchableOpacity
            onPress={handleImagePick}
            style={{
              borderWidth: 2,
              borderColor: selectedImage ? colors.success[500] : colors.neutral[300],
              borderStyle: 'dashed',
              borderRadius: 8,
              padding: spacing[6],
              alignItems: 'center',
              backgroundColor: selectedImage ? colors.success[100] : colors.neutral[100],
            }}
            disabled={isUploading}
          >
            {selectedImage ? (
              <View style={{ alignItems: 'center' }}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{ width: 120, height: 90, borderRadius: 8, marginBottom: spacing[3] }}
                />
                <Text style={{ fontSize: 16, fontWeight: '400', color: colors.success[600] }}>
                  Receipt selected ✓
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '400', color: colors.neutral[600], marginTop: spacing[2] }}>
                  Tap to change image
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48, color: colors.neutral[400] }}>📷</Text>
                <Text style={{ fontSize: 16, fontWeight: '400', color: colors.neutral[600], marginTop: spacing[2] }}>
                  Tap to select receipt image
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '400', color: colors.neutral[500], marginTop: spacing[1] }}>
                  JPEG or PNG, max 5MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
                            borderRadius: 8,
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
                    <Text style={{ color: colors.error[500], marginTop: spacing[1], ...typography.caption }}>
                      {errors.brandId.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Bill Amount */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{ ...typography.label, marginBottom: spacing[2] }}>Bill Amount (₹) *</Text>
            <Controller
              control={control}
              name="billAmount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: errors.billAmount ? colors.error[500] : colors.neutral[300],
                    borderRadius: 8,
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
              <Text style={{ color: colors.error[500], marginTop: spacing[1], ...typography.caption }}>
                {errors.billAmount.message}
              </Text>
            )}
          </View>

          {/* Bill Date */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{ ...typography.label, marginBottom: spacing[2] }}>Bill Date *</Text>
            <Controller
              control={control}
              name="billDate"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.neutral[300],
                    borderRadius: 8,
                    padding: spacing[3],
                    backgroundColor: colors.white,
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.neutral[700] }}>
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
              <Text style={{ color: colors.error[500], marginTop: spacing[1], ...typography.caption }}>
                {errors.billDate.message}
              </Text>
            )}
          </View>

          {/* Notes */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{ ...typography.label, marginBottom: spacing[2] }}>Notes (Optional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.neutral[300],
                    borderRadius: 8,
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
              <Text style={{ color: colors.error[500], marginTop: spacing[1], ...typography.caption }}>
                {errors.notes.message}
              </Text>
            )}
          </View>

          {/* Coins Preview */}
          {watchedBrandId && selectedBrand && (
            <View style={{
              backgroundColor: colors.success[50],
              padding: spacing[4],
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: colors.success[500],
            }}>
              <Text style={{ ...typography.h3, color: colors.success[700], marginBottom: spacing[2] }}>
                You'll Earn
              </Text>
              <Text style={{ ...typography.h1, color: colors.success[600] }}>
                {calculateCoinsEarned(watch('billAmount') || 0, watchedBrandId)} Coins
              </Text>
              <Text style={{ ...typography.caption, color: colors.success[600] }}>
                Based on {selectedBrand.earningPercentage}% of ₹{watch('billAmount') || 0}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting || isUploading || !selectedImage}
          style={{
            backgroundColor: (!isValid || isSubmitting || isUploading || !selectedImage) 
              ? colors.neutral[300] 
              : colors.primary[500],
            padding: spacing[4],
            borderRadius: 8,
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
