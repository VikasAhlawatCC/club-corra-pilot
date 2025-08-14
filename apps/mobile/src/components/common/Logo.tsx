import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../../styles/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export function Logo({ size = 'medium', showTagline = false }: LogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { gap: spacing[2] },
          logoCircle: { width: 24, height: 24 },
          logoText: { fontSize: typography.fontSize.sm },
          appName: { fontSize: typography.fontSize.md },
          tagline: { fontSize: typography.fontSize.xs },
        };
      case 'large':
        return {
          container: { gap: spacing[4] },
          logoCircle: { width: 64, height: 64 },
          logoText: { fontSize: typography.fontSize['3xl'] },
          appName: { fontSize: typography.fontSize['2xl'] },
          tagline: { fontSize: typography.fontSize.sm },
        };
      default: // medium
        return {
          container: { gap: spacing[3] },
          logoCircle: { width: 32, height: 32 },
          logoText: { fontSize: typography.fontSize.xl },
          appName: { fontSize: typography.fontSize.lg },
          tagline: { fontSize: typography.fontSize.xs },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {/* Premium Gold Logo Circle - Matching wireframe exactly */}
      <View style={[styles.logoCircle, sizeStyles.logoCircle]}>
        <LinearGradient
          colors={[colors.gold[100], colors.gold[300], colors.gold[500]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner circle with dark border */}
          <View style={styles.innerCircle}>
            <Text style={[styles.logoText, sizeStyles.logoText]}>CC</Text>
          </View>
        </LinearGradient>
      </View>

      {/* App Name and Tagline */}
      <View style={styles.textContainer}>
        <Text style={[styles.appName, sizeStyles.appName]}>
          <Text style={styles.clubText}>Club</Text>
          <Text style={styles.corraText}> Corra</Text>
        </Text>
        {showTagline && (
          <Text style={[styles.tagline, sizeStyles.tagline]}>
            Earn. Elevate. Indulge.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    borderRadius: 9999,
    overflow: 'hidden',
    // Premium shadow effect matching wireframe
    shadowColor: colors.gold[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: '85%',
    height: '85%',
    borderRadius: 9999,
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: colors.background.dark[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    color: colors.background.dark[900],
    fontWeight: '800',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  appName: {
    fontFamily: typography.fontFamily.display,
    fontWeight: '700',
    lineHeight: 20,
  },
  clubText: {
    color: colors.gold[400],
  },
  corraText: {
    color: colors.text.white,
  },
  tagline: {
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginTop: -2,
    lineHeight: 12,
  },
});
