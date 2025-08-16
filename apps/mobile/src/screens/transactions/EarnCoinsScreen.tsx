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
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../stores/auth.store';
import { useBrandsStore } from '../../stores/brands.store';
import { useTransactionsStore } from '../../stores/transactions.store';
import { fileUploadService } from '../../services/file-upload.service';
import { apiService } from '../../services/api.service';
import { colors, typography, spacing, borderRadius, shadows, glassEffects } from '../../styles/theme';
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
  const { user, isAuthenticated } = useAuthStore();

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
      billAmount: 0, // Keep as 0 for initial state
      billDate: new Date(),
      receiptUrl: '',
      notes: '',
    },
    mode: 'onChange',
  });

  const watchedBrandId = watch('brandId');
  const watchedBillAmount = watch('billAmount');
  const watchedBillDate = watch('billDate');
  const watchedNotes = watch('notes');
  const selectedBrand = brands.find(b => b.id === watchedBrandId);

  // Check if form is ready to submit
  const isFormReady = watchedBrandId && 
    watchedBillAmount > 0 && 
    selectedFile && 
    !isSubmitting && 
    !isUploading;
  
  // Debug logging for form readiness
  useEffect(() => {
    console.log('Form readiness check:', {
      watchedBrandId,
      watchedBillAmount,
      selectedFile: !!selectedFile,
      isSubmitting,
      isUploading,
      isFormReady,
      brandIdValid: !!watchedBrandId,
      billAmountValid: watchedBillAmount > 0,
      fileSelected: !!selectedFile,
      notSubmitting: !isSubmitting,
      notUploading: !isUploading
    });
  }, [watchedBrandId, watchedBillAmount, selectedFile, isSubmitting, isUploading, isFormReady]);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Debug auth state on mount
  useEffect(() => {
    console.log('=== EARN SCREEN MOUNT DEBUG ===');
    console.log('user:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('tokens:', useAuthStore.getState().tokens);
    console.log('brands:', brands);
  }, [user, isAuthenticated, brands]);

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

    console.log('=== UPLOAD FILE DEBUG ===');
    console.log('Current auth state:', {
      isAuthenticated,
      user: !!user,
      tokens: !!useAuthStore.getState().tokens,
      accessToken: !!useAuthStore.getState().tokens?.accessToken
    });
    console.log('API Service tokens:', {
      hasAccessToken: !!apiService.getAccessToken(),
      accessTokenLength: apiService.getAccessToken()?.length
    });

    setIsUploading(true);
    try {
      // Get upload URL from backend
      const uploadUrl = await fileUploadService.getUploadUrl({
        fileName: selectedFile.name || `receipt_${Date.now()}.${selectedFile.type === 'application/pdf' ? 'pdf' : 'jpg'}`,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      console.log('Upload URL response:', uploadUrl);

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

      // Return a proper URL for the receipt
      // For now, construct a URL using the file key and CDN domain
      const receiptUrl = `https://cdn.clubcorra.com/${uploadUrl.fileKey}`;
      console.log('Generated receipt URL:', receiptUrl);
      
      return receiptUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: EarnFormData) => {
    console.log('onSubmit function called!');
    console.log('Form data:', data);
    console.log('Selected file:', selectedFile);
    
    try {
      if (!selectedFile) {
        Alert.alert('Error', 'Please select a receipt file');
        return;
      }

      console.log('Starting file upload...');
      // Upload file first
      const receiptUrl = await uploadFile();
      console.log('File uploaded successfully:', receiptUrl);
      
      // Update form data with actual receipt URL and convert Date to ISO string
      const submitData = {
        ...data,
        receiptUrl,
        billDate: data.billDate, // Keep as Date object for backend
      };

      console.log('=== SUBMIT DATA DEBUG ===');
      console.log('Submit data:', submitData);
      console.log('Submit data types:', {
        userId: typeof submitData.userId,
        brandId: typeof submitData.brandId,
        billAmount: typeof submitData.billAmount,
        billDate: typeof submitData.billDate,
        receiptUrl: typeof submitData.receiptUrl,
        notes: typeof submitData.notes
      });
      console.log('User ID:', submitData.userId);
      console.log('Brand ID:', submitData.brandId);
      console.log('Bill Amount:', submitData.billAmount);
      console.log('Bill Date:', submitData.billDate);
      console.log('Receipt URL:', submitData.receiptUrl);

      console.log('Submitting to backend:', submitData);
      const response = await submitEarnRequest(submitData);
      console.log('Backend response:', response);
      
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
      console.error('Error in onSubmit:', error);
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
          <Text style={styles.title}>Earn Coins</Text>
          <Text style={styles.subtitle}>
            Upload your receipt and earn Corra coins based on your purchase
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
            Take a clear photo or upload your receipt to start earning
          </Text>
          
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          
          {/* Brand Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Select Brand *</Text>
            <Controller
              control={control}
              name="brandId"
              render={({ field: { onChange, value } }) => (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.brandContainer}>
                      {brands.map((brand) => (
                        <TouchableOpacity
                          key={brand.id}
                          onPress={() => onChange(brand.id)}
                          style={[
                            styles.brandCard,
                            value === brand.id && styles.brandCardSelected
                          ]}
                        >
                          <View style={styles.brandContent}>
                            <Text style={[
                              styles.brandName,
                              value === brand.id && styles.brandNameSelected
                            ]}>
                              {brand.name}
                            </Text>
                            <Text style={[
                              styles.brandPercentage,
                              value === brand.id && styles.brandPercentageSelected
                            ]}>
                              {brand.earningPercentage}% back
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {errors.brandId && (
                    <Text style={styles.errorText}>
                      {errors.brandId.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Bill Amount */}
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
                    value={value ? value.toString() : ''}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? 0 : num);
                    }}
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

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
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
            {errors.notes && (
              <Text style={styles.errorText}>
                {errors.notes.message}
              </Text>
            )}
          </View>

          {/* Coins Preview */}
          {watchedBrandId && selectedBrand && (
            <View style={styles.coinsPreview}>
              <View style={styles.coinsPreviewHeader}>
                <Ionicons name="star" size={24} color={colors.gold[500]} />
                <Text style={styles.coinsPreviewTitle}>You'll Earn</Text>
              </View>
              <Text style={styles.coinsAmount}>
                {calculateCoinsEarned(watchedBillAmount || 0, watchedBrandId)} Coins
              </Text>
              <Text style={styles.coinsDescription}>
                Based on {selectedBrand.earningPercentage}% of ₹{watchedBillAmount || 0}
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={() => {
            console.log('Submit button clicked!');
            console.log('=== AUTH STATE DEBUG ===');
            console.log('user:', user);
            console.log('isAuthenticated:', isAuthenticated);
            console.log('tokens:', useAuthStore.getState().tokens);
            console.log('accessToken exists:', !!useAuthStore.getState().tokens?.accessToken);
            console.log('accessToken length:', useAuthStore.getState().tokens?.accessToken?.length);
            console.log('accessToken preview:', useAuthStore.getState().tokens?.accessToken?.substring(0, 20) + '...');
            console.log('=== FORM STATE DEBUG ===');
            console.log('isFormReady:', isFormReady);
            console.log('watchedBrandId:', watchedBrandId);
            console.log('watchedBillAmount:', watchedBillAmount);
            console.log('selectedFile:', selectedFile);
            console.log('isSubmitting:', isSubmitting);
            console.log('isUploading:', isUploading);
            console.log('=== FORM VALIDATION DEBUG ===');
            console.log('Form errors:', errors);
            console.log('Form isValid:', isValid);
            console.log('Form values:', {
              userId: watch('userId'),
              brandId: watch('brandId'),
              billAmount: watch('billAmount'),
              billDate: watch('billDate'),
              notes: watch('notes')
            });
            
            if (isFormReady) {
              console.log('Form is ready, calling onSubmit directly...');
              // Call onSubmit directly instead of using handleSubmit
              const formData = {
                userId: user?.id || '',
                brandId: watchedBrandId,
                billAmount: watchedBillAmount,
                billDate: watchedBillDate,
                receiptUrl: '',
                notes: watchedNotes,
              };
              onSubmit(formData);
            } else {
              console.log('Form not ready, cannot submit');
              if (!watchedBrandId) console.log('Missing brandId');
              if (watchedBillAmount <= 0) console.log('billAmount is 0 or negative');
              if (!selectedFile) console.log('Missing selectedFile');
              if (isSubmitting) console.log('Already submitting');
              if (isUploading) console.log('Already uploading');
            }
          }}
          disabled={!isFormReady}
          style={[
            styles.submitButton,
            (!isFormReady) && styles.submitButtonDisabled
          ]}
        >
          {isSubmitting || isUploading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.submitButtonText}>
                {isUploading ? 'Uploading...' : 'Submit Earn Request'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
            <Text style={styles.errorMessage}>
              {error}
            </Text>
          </View>
        )}
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
  fieldContainer: {
    marginBottom: spacing[5],
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  brandContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  brandCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.card.border,
    minWidth: 100,
    alignItems: 'center',
    ...shadows.card,
  },
  brandCardSelected: {
    borderColor: colors.gold[500],
    backgroundColor: colors.gold[100],
    ...shadows.gold,
  },
  brandContent: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  brandNameSelected: {
    color: colors.text.dark,
  },
  brandPercentage: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  brandPercentageSelected: {
    color: colors.text.dark,
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
    marginTop: spacing[1],
    fontSize: 14,
  },
  coinsPreview: {
    backgroundColor: colors.success[50],
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
    marginTop: spacing[4],
  },
  coinsPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  coinsPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success[700],
    marginLeft: spacing[2],
  },
  coinsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success[600],
    marginBottom: spacing[2],
  },
  coinsDescription: {
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
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  errorMessage: {
    color: colors.error[700],
    ...typography.body,
    flex: 1,
  },
  authStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
    padding: spacing[3],
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.input,
  },
  authStatusText: {
    marginLeft: spacing[2],
    fontSize: 14,
    fontWeight: '500',
  },
});
