import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography, borderRadius } from '@/styles/theme';

interface FileUploadProps {
  onFileSelect: (file: any) => void;
  onFileRemove: () => void;
  selectedFile: any | null;
  label?: string;
  placeholder?: string;
  acceptTypes?: ('image' | 'pdf')[];
  maxSize?: number; // in MB
  disabled?: boolean;
  loading?: boolean;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  label = 'Upload File',
  placeholder = 'Tap to select file',
  acceptTypes = ['image', 'pdf'],
  maxSize = 5, // 5MB default
  disabled = false,
  loading = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: any) => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      throw new Error(`File size must be less than ${maxSize}MB`);
    }
    
    if (acceptTypes.includes('image') && acceptTypes.includes('pdf')) {
      // Accept both images and PDFs
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG images and PDF files are allowed');
      }
    } else if (acceptTypes.includes('image')) {
      // Only images
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG and PNG images are allowed');
      }
    } else if (acceptTypes.includes('pdf')) {
      // Only PDFs
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }
    }
  };

  const handleImagePick = async () => {
    try {
      setIsUploading(true);
      
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
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `receipt_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
        };
        
        validateFile(file);
        onFileSelect(file);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentPick = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: 'application/pdf',
          name: asset.name || `receipt_${Date.now()}.pdf`,
          size: asset.size || 0,
        };
        
        validateFile(file);
        onFileSelect(file);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilePick = () => {
    if (disabled || loading || isUploading) return;

    if (acceptTypes.includes('image') && acceptTypes.includes('pdf')) {
      Alert.alert(
        'Select File Type',
        'Choose the type of file you want to upload',
        [
          {
            text: 'Image',
            onPress: handleImagePick,
          },
          {
            text: 'PDF',
            onPress: handleDocumentPick,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else if (acceptTypes.includes('image')) {
      handleImagePick();
    } else if (acceptTypes.includes('pdf')) {
      handleDocumentPick();
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onFileRemove,
        },
      ]
    );
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    if (selectedFile.type === 'application/pdf') {
      return (
        <View style={styles.pdfPreview}>
          <Ionicons name="document" size={48} color={colors.gray[400]} />
          <Text style={styles.fileName} numberOfLines={1}>
            {selectedFile.name}
          </Text>
        </View>
      );
    }

    return (
      <Image source={{ uri: selectedFile.uri }} style={styles.imagePreview} />
    );
  };

  if (loading || isUploading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.gold[500]} />
        <Text style={styles.loadingText}>
          {isUploading ? 'Processing file...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      {selectedFile ? (
        <View style={styles.fileContainer}>
          {renderFilePreview()}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveFile}
            disabled={disabled}
          >
            <Ionicons name="close-circle" size={24} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
          onPress={handleFilePick}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="cloud-upload-outline" 
            size={32} 
            color={disabled ? colors.gray[400] : colors.gold[500]} 
          />
          <Text style={[styles.uploadText, disabled && styles.uploadTextDisabled]}>
            {placeholder}
          </Text>
          <Text style={[styles.uploadSubtext, disabled && styles.uploadSubtextDisabled]}>
            {acceptTypes.includes('image') && acceptTypes.includes('pdf') 
              ? 'Images or PDF up to 5MB' 
              : acceptTypes.includes('image') 
                ? 'Images up to 5MB' 
                : 'PDF up to 5MB'
            }
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[4],
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.gold[300],
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.light[50],
    minHeight: 120,
  },
  uploadButtonDisabled: {
    borderColor: colors.gray[300],
    backgroundColor: colors.background.light[100],
  },
  uploadText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  uploadTextDisabled: {
    color: colors.text.secondary,
  },
  uploadSubtext: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  uploadSubtextDisabled: {
    color: colors.gray[400],
  },
  fileContainer: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.light[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  pdfPreview: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.light[100],
  },
  fileName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[2],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  removeButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    padding: spacing[1],
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
});
