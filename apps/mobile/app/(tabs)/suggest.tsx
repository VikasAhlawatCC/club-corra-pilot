import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/common';
import { colors, spacing, borderRadius, typography, shadows } from '@/styles/theme';

export default function SuggestScreen() {
  const [suggestionType, setSuggestionType] = useState<'brand' | 'feature'>('brand');
  const [suggestionText, setSuggestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestionText.trim()) {
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuggestionText('');
      // Show success message
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark[900], colors.background.dark[800]]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Suggest</Text>
            <Text style={styles.headerSubtitle}>Help us improve Club Corra</Text>
          </View>

          {/* Suggestion Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                suggestionType === 'brand' && styles.typeButtonActive
              ]}
              onPress={() => setSuggestionType('brand')}
            >
              <Ionicons 
                name="business" 
                size={20} 
                color={suggestionType === 'brand' ? colors.text.white : colors.text.secondary} 
              />
              <Text style={[
                styles.typeButtonText,
                suggestionType === 'brand' && styles.typeButtonTextActive
              ]}>
                Suggest Brand
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                suggestionType === 'feature' && styles.typeButtonActive
              ]}
              onPress={() => setSuggestionType('feature')}
            >
              <Ionicons 
                name="bulb" 
                size={20} 
                color={suggestionType === 'feature' ? colors.text.white : colors.text.secondary} 
              />
              <Text style={[
                styles.typeButtonText,
                suggestionType === 'feature' && styles.typeButtonTextActive
              ]}>
                Suggest Feature
              </Text>
            </TouchableOpacity>
          </View>

          {/* Suggestion Form */}
          <Card variant="elevated" padding={8} style={styles.suggestionCard}>
            <Text style={styles.formTitle}>
              {suggestionType === 'brand' ? 'Suggest a New Brand' : 'Suggest a New Feature'}
            </Text>
            <Text style={styles.formSubtitle}>
              {suggestionType === 'brand' 
                ? 'Tell us about a brand you\'d like to see on Club Corra'
                : 'Share your ideas to make Club Corra even better'
              }
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textArea}
                placeholder={
                  suggestionType === 'brand' 
                    ? "Brand name and why you'd like to see it..."
                    : "Describe your feature idea..."
                }
                placeholderTextColor={colors.text.muted}
                value={suggestionText}
                onChangeText={setSuggestionText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <Button
              title="Submit Suggestion"
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="primary"
              size="large"
              fullWidth
              disabled={!suggestionText.trim()}
            />
          </Card>

          {/* Recent Suggestions */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Suggestions</Text>
            <View style={styles.suggestionsList}>
              <BlurView intensity={20} style={styles.suggestionItem}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="business" size={16} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.suggestionType}>Brand Suggestion</Text>
                  <Text style={styles.suggestionStatus}>Under Review</Text>
                </View>
                <Text style={styles.suggestionText}>Add Nike to partner brands</Text>
                <Text style={styles.suggestionDate}>2 days ago</Text>
              </BlurView>

              <BlurView intensity={20} style={styles.suggestionItem}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="bulb" size={16} color={colors.success[500]} />
                  </View>
                  <Text style={styles.suggestionType}>Feature Suggestion</Text>
                  <Text style={styles.suggestionStatus}>Implemented</Text>
                </View>
                <Text style={styles.suggestionText}>Dark mode theme option</Text>
                <Text style={styles.suggestionDate}>1 week ago</Text>
              </BlurView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[20],
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },

  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.dark[800],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing[2],
  },
  typeButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  typeButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  typeButtonTextActive: {
    color: colors.text.white,
  },

  // Suggestion Form
  suggestionCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  formSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  textArea: {
    height: 120,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },

  // Recent Suggestions
  recentSection: {
    paddingHorizontal: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  suggestionsList: {
    gap: spacing[3],
  },
  suggestionItem: {
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  suggestionIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  suggestionType: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  suggestionStatus: {
    fontSize: typography.fontSize.xs,
    color: colors.success[500],
    fontFamily: typography.fontFamily.medium,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing[2],
  },
  suggestionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
});
