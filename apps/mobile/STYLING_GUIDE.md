# Club Corra Mobile - Styling Guide

## Overview

This guide documents the comprehensive styling system used in the Club Corra mobile app. We've replaced NativeWind with a custom React Native StyleSheet utility system that provides:

- **Consistent Design System**: Typography, colors, spacing, and shadows
- **Utility Classes**: Similar to Tailwind CSS but using React Native StyleSheet
- **Type Safety**: Full TypeScript support with proper type definitions
- **Performance**: Native React Native styling without external dependencies
- **Maintainability**: Centralized theme and utility management

## Architecture

### File Structure

```
src/styles/
├── index.ts          # Main export file
├── theme.ts          # Design tokens (colors, typography, spacing)
├── common.ts         # Common utility styles
├── utilities.ts      # Advanced utility system
├── components.ts     # Component-specific styles
├── layouts.ts        # Layout utilities
└── animations.ts     # Animation utilities
```

### Core Principles

1. **Design Tokens First**: All styles derive from centralized design tokens
2. **Utility-First Approach**: Use utility classes for common patterns
3. **Component-Specific Styles**: Custom styles for unique components
4. **Consistent Naming**: Follow established naming conventions
5. **Performance Optimized**: Minimize style object creation

## Design System

### Colors

```typescript
import { colors } from '../styles/theme';

// Primary brand colors
colors.primary[500]    // Main brand color
colors.primary[400]    // Lighter variant
colors.primary[600]    // Darker variant

// Background colors
colors.background.primary    // Main background
colors.background.secondary  // Secondary background
colors.background.dark[800]  // Dark variant

// Text colors
colors.text.primary    // Primary text
colors.text.secondary  // Secondary text
colors.text.muted      // Muted text
```

### Typography

```typescript
import { typography } from '../styles/theme';

// Font sizes
typography.fontSize.xs      // 12px
typography.fontSize.sm      // 14px
typography.fontSize.base    // 16px
typography.fontSize.lg      // 18px
typography.fontSize.xl      // 20px
typography.fontSize['2xl']  // 24px

// Font families
typography.fontFamily.regular      // Inter-Regular
typography.fontFamily.medium       // Inter-Medium
typography.fontFamily.semiBold     // Inter-SemiBold
typography.fontFamily.bold         // Inter-Bold
typography.fontFamily.display      // Poppins-Bold
```

### Spacing

```typescript
import { spacing } from '../styles/theme';

// Spacing scale (4px base unit)
spacing[0]   // 0px
spacing[1]   // 4px
spacing[2]   // 8px
spacing[3]   // 12px
spacing[4]   // 16px
spacing[5]   // 20px
spacing[6]   // 24px
spacing[8]   // 32px
spacing[10]  // 40px
spacing[12]  // 48px
spacing[16]  // 64px
spacing[20]  // 80px
spacing[24]  // 96px
```

### Border Radius

```typescript
import { borderRadius } from '../styles/theme';

borderRadius.none     // 0px
borderRadius.sm       // 4px
borderRadius.base     // 6px
borderRadius.md       // 8px
borderRadius.lg       // 12px
borderRadius.xl       // 16px
borderRadius['2xl']   // 24px
borderRadius['3xl']   // 32px
borderRadius.full     // 9999px (circular)
```

## Utility System

### Layout Utilities

```typescript
import { layoutUtils } from '../styles/utilities';

// Flexbox
layoutUtils.flex           // flex: 1
layoutUtils.flexRow        // flexDirection: 'row'
layoutUtils.flexCol        // flexDirection: 'column'
layoutUtils.itemsCenter    // alignItems: 'center'
layoutUtils.justifyCenter  // justifyContent: 'center'
layoutUtils.justifyBetween // justifyContent: 'space-between'

// Position
layoutUtils.absolute       // position: 'absolute'
layoutUtils.relative       // position: 'relative'
layoutUtils.top0           // top: 0
layoutUtils.right0         // right: 0
```

### Spacing Utilities

```typescript
import { spacingUtils } from '../styles/utilities';

// Padding
spacingUtils.p0    // padding: 0
spacingUtils.p4    // padding: 16px
spacingUtils.px6   // paddingHorizontal: 24px
spacingUtils.py8   // paddingVertical: 32px
spacingUtils.pt12  // paddingTop: 48px
spacingUtils.pb16  // paddingBottom: 64px

// Margin
spacingUtils.m0    // margin: 0
spacingUtils.m4    // margin: 16px
spacingUtils.mx6   // marginHorizontal: 24px
spacingUtils.my8   // marginVertical: 32px
spacingUtils.mt12  // marginTop: 48px
spacingUtils.mb16  // marginBottom: 64px
```

### Text Utilities

```typescript
import { textUtils } from '../styles/utilities';

// Font sizes
textUtils.textXs      // fontSize: 12px
textUtils.textSm      // fontSize: 14px
textUtils.textBase    // fontSize: 16px
textUtils.textLg      // fontSize: 18px
textUtils.textXl      // fontSize: 20px

// Font weights
textUtils.fontNormal     // fontWeight: '400'
textUtils.fontMedium     // fontWeight: '500'
textUtils.fontSemiBold   // fontWeight: '600'
textUtils.fontBold       // fontWeight: '700'

// Text colors
textUtils.textPrimary    // color: white
textUtils.textSecondary  // color: secondary text
textUtils.textMuted      // color: muted text

// Text alignment
textUtils.textCenter     // textAlign: 'center'
textUtils.textLeft       // textAlign: 'left'
textUtils.textRight      // textAlign: 'right'
```

### Background Utilities

```typescript
import { backgroundUtils } from '../styles/utilities';

// Background colors
backgroundUtils.bgPrimary      // backgroundColor: primary
backgroundUtils.bgSecondary    // backgroundColor: secondary
backgroundUtils.bgDark800      // backgroundColor: dark[800]
backgroundUtils.bgPrimary500   // backgroundColor: primary[500]
backgroundUtils.bgSuccess500   // backgroundColor: success[500]
backgroundUtils.bgError500     // backgroundColor: error[500]
```

### Border Utilities

```typescript
import { borderUtils } from '../styles/utilities';

// Border radius
borderUtils.roundedNone    // borderRadius: 0
borderUtils.roundedSm      // borderRadius: 4px
borderUtils.roundedBase    // borderRadius: 6px
borderUtils.roundedLg      // borderRadius: 12px
borderUtils.roundedXl      // borderRadius: 16px
borderUtils.rounded2xl     // borderRadius: 24px
borderUtils.roundedFull    // borderRadius: 9999px

// Border width
borderUtils.border0        // borderWidth: 0
borderUtils.border         // borderWidth: 1
borderUtils.border2        // borderWidth: 2
borderUtils.border4        // borderWidth: 4

// Border colors
borderUtils.borderLight    // borderColor: light
borderUtils.borderPrimary  // borderColor: primary
borderUtils.borderError    // borderColor: error
```

### Size Utilities

```typescript
import { sizeUtils } from '../styles/utilities';

// Width
sizeUtils.wFull     // width: '100%'
sizeUtils.w0        // width: 0
sizeUtils.w4        // width: 16px
sizeUtils.w8        // width: 32px
sizeUtils.w16       // width: 64px
sizeUtils.w24       // width: 96px

// Height
sizeUtils.hFull     // height: '100%'
sizeUtils.h0        // height: 0
sizeUtils.h4        // height: 16px
sizeUtils.h8        // height: 32px
sizeUtils.h16       // height: 64px
sizeUtils.h24       // height: 96px
```

## Usage Examples

### Basic Component Styling

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing[6],
    borderRadius: borderRadius.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
```

### Using Utility Classes

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { 
  layoutUtils, 
  spacingUtils, 
  textUtils, 
  backgroundUtils,
  borderUtils 
} from '../styles/utilities';

export function MyComponent() {
  return (
    <View style={[
      layoutUtils.flex,
      layoutUtils.itemsCenter,
      layoutUtils.justifyCenter,
      spacingUtils.p6,
      backgroundUtils.bgPrimary,
      borderUtils.roundedLg
    ]}>
      <Text style={[
        textUtils.textXl,
        textUtils.fontBold,
        textUtils.textCenter,
        textUtils.textPrimary
      ]}>
        Hello World
      </Text>
    </View>
  );
}
```

### Combining Styles

```typescript
import { combineStyles } from '../styles/utilities';

const styles = StyleSheet.create({
  base: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  large: {
    padding: spacing[6],
  },
});

// Usage
<View style={combineStyles(styles.base, styles.primary, styles.large)} />
```

### Conditional Styling

```typescript
import { conditionalStyle } from '../styles/utilities';

const styles = StyleSheet.create({
  button: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
  },
  buttonActive: {
    backgroundColor: colors.primary[500],
  },
  buttonInactive: {
    backgroundColor: colors.background.dark[700],
  },
});

// Usage
<View style={[
  styles.button,
  conditionalStyle(isActive, styles.buttonActive, styles.buttonInactive)
]} />
```

## Best Practices

### 1. Use Design Tokens

✅ **Good**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing[6],
    borderRadius: borderRadius.lg,
  },
});
```

❌ **Avoid**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0F23',
    padding: 24,
    borderRadius: 12,
  },
});
```

### 2. Leverage Utility Classes

✅ **Good**
```typescript
<View style={[
  layoutUtils.flex,
  layoutUtils.itemsCenter,
  spacingUtils.p6,
  backgroundUtils.bgPrimary
]}>
```

❌ **Avoid**
```typescript
<View style={{
  flex: 1,
  alignItems: 'center',
  padding: 24,
  backgroundColor: colors.background.primary
}}>
```

### 3. Component-Specific Styles

✅ **Good**
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    shadowColor: colors.background.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
```

### 4. Consistent Naming

- Use camelCase for style properties
- Use descriptive names that reflect the purpose
- Group related styles together

```typescript
const styles = StyleSheet.create({
  // Layout
  container: { ... },
  content: { ... },
  
  // Typography
  title: { ... },
  subtitle: { ... },
  body: { ... },
  
  // Interactive elements
  button: { ... },
  buttonActive: { ... },
  buttonDisabled: { ... },
});
```

## Migration from NativeWind

### Before (NativeWind)
```typescript
<View className="flex-1 bg-dark-950">
  <Text className="text-2xl font-bold text-white text-center">
    Hello World
  </Text>
</View>
```

### After (StyleSheet)
```typescript
<View style={[
  layoutUtils.flex,
  backgroundUtils.bgDark950
]}>
  <Text style={[
    textUtils.text2xl,
    textUtils.fontBold,
    textUtils.textWhite,
    textUtils.textCenter
  ]}>
    Hello World
  </Text>
</View>
```

## Performance Considerations

### 1. Style Object Creation

✅ **Good** - Styles created once
```typescript
const styles = StyleSheet.create({
  container: {
    padding: spacing[6],
    backgroundColor: colors.background.primary,
  },
});
```

❌ **Avoid** - Styles created on every render
```typescript
<View style={{
  padding: spacing[6],
  backgroundColor: colors.background.primary,
}} />
```

### 2. Utility Class Arrays

✅ **Good** - Reuse utility arrays
```typescript
const commonStyles = [
  layoutUtils.flex,
  layoutUtils.itemsCenter,
  spacingUtils.p6,
];

<View style={[...commonStyles, backgroundUtils.bgPrimary]} />
<View style={[...commonStyles, backgroundUtils.bgSecondary]} />
```

### 3. Conditional Styling

✅ **Good** - Use conditionalStyle helper
```typescript
<View style={[
  styles.base,
  conditionalStyle(isActive, styles.active, styles.inactive)
]} />
```

## Troubleshooting

### Common Issues

1. **Styles not applying**: Check import paths and ensure styles are properly exported
2. **Type errors**: Verify TypeScript types and ensure proper imports
3. **Performance issues**: Avoid inline styles and use StyleSheet.create
4. **Inconsistent spacing**: Always use spacing tokens instead of hardcoded values

### Debug Tips

1. **Console.log styles**: Log style objects to verify they're correct
2. **React DevTools**: Use React DevTools to inspect component styles
3. **Style validation**: Use TypeScript to catch style errors at compile time

## Conclusion

This styling system provides a robust, performant, and maintainable approach to styling React Native components. By following the established patterns and using the utility system effectively, you can create consistent, beautiful UIs that are easy to maintain and modify.

For questions or improvements, refer to the existing components as examples or consult the team for guidance.
