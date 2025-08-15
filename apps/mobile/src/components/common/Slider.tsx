import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography, borderRadius } from '@/styles/theme';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  label?: string;
  valueLabel?: string;
  disabled?: boolean;
}

export default function CustomSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  label,
  valueLabel,
  disabled = false,
}: SliderProps) {
  const handleValueChange = (newValue: number) => {
    onValueChange(newValue);
    
    // Announce value change for accessibility
    if (valueLabel) {
      AccessibilityInfo.announceForAccessibility(`${valueLabel}: ${Math.round(newValue)}`);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={handleValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          disabled={disabled}
          minimumTrackTintColor={colors.gold[500]}
          maximumTrackTintColor={colors.gray[400]}
          thumbStyle={styles.thumb}
          trackStyle={styles.track}
          accessibilityLabel={label || 'Amount slider'}
          accessibilityHint="Double tap and drag to adjust the amount"
          accessibilityValue={{
            min: minimumValue,
            max: maximumValue,
            now: value,
          }}
        />
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={styles.minValue}>{minimumValue}</Text>
        <Text style={styles.currentValue}>{Math.round(value)}</Text>
        <Text style={styles.maxValue}>{maximumValue}</Text>
      </View>
      
      {valueLabel && (
        <Text style={styles.valueLabel}>{valueLabel}</Text>
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
    textAlign: 'center',
  },
  sliderContainer: {
    marginVertical: spacing[2],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    backgroundColor: colors.gold[500],
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.gold[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  track: {
    height: 6,
    borderRadius: borderRadius.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  minValue: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  currentValue: {
    ...typography.bodyLarge,
    color: colors.gold[500],
    fontWeight: '600',
  },
  maxValue: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  valueLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
