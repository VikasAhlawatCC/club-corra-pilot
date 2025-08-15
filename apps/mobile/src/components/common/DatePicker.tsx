import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, borderRadius } from '@/styles/theme';

interface DatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
}

export default function CustomDatePicker({
  value,
  onDateChange,
  label,
  placeholder = 'Select date',
  minimumDate,
  maximumDate = new Date(), // Default to today
  disabled = false,
  error,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          disabled && styles.dateButtonDisabled,
          error && styles.dateButtonError,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.dateContent}>
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={disabled ? colors.gray[400] : colors.gold[500]} 
          />
          <Text style={[
            styles.dateText,
            disabled && styles.dateTextDisabled,
            !value && styles.placeholderText,
          ]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={disabled ? colors.gray[400] : colors.gray[500]} 
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          style={styles.picker}
        />
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  dateButtonDisabled: {
    borderColor: colors.gray[200],
    backgroundColor: colors.background.light[100],
  },
  dateButtonError: {
    borderColor: colors.error[500],
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginLeft: spacing[3],
    flex: 1,
  },
  dateTextDisabled: {
    color: colors.text.secondary,
  },
  placeholderText: {
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error[500],
    marginTop: spacing[2],
    marginLeft: spacing[1],
  },
  picker: {
    backgroundColor: colors.white,
  },
});
