# Welcome Bonus Animation Feature

## Overview

The Welcome Bonus Animation is a playful, slot machine-like animation that plays when a new user first lands on the home page after completing signup. It shows the user's Corra Coins increasing from 0 to 100 with engaging visual effects.

## Features

### 🎯 Core Animation
- **Coin Counter**: Animated counting from 0 to 100 Corra Coins
- **Slot Machine Effect**: Random increments with varying speeds
- **Bouncing Coins**: 3D-like bounce animation for the coin display
- **Glowing Text**: Pulsing glow effect on the coin amount

### 🎨 Visual Elements
- **Graffiti Style Text**: "🎉 WELCOME BONUS! 🎉" and "100 COINS ADDED!"
- **Confetti Animation**: Colorful confetti pieces flying around
- **Celebration Icons**: Animated star, sparkles, and gift icons
- **Colorful Design**: Uses the app's gold and primary color scheme

### 🔄 Animation Sequence
1. **Initial Load**: Coin appears with scale animation
2. **Bounce Effect**: Coin bounces 3 times for emphasis
3. **Counter Animation**: Numbers increment randomly from 0 to 100
4. **Text Effects**: Graffiti text scales and rotates slightly
5. **Confetti Burst**: Colorful pieces fly around the screen
6. **Completion**: Animation finishes and calls completion callback

## Implementation

### Components

#### WelcomeBonusAnimation
- **Location**: `apps/mobile/src/components/common/WelcomeBonusAnimation.tsx`
- **Props**:
  - `isVisible`: Boolean to control visibility
  - `onAnimationComplete`: Callback when animation finishes

#### useWelcomeBonus Hook
- **Location**: `apps/mobile/src/hooks/useWelcomeBonus.ts`
- **Purpose**: Manages welcome bonus state and determines when to show animation
- **Features**:
  - Tracks if animation has been shown for each user
  - Persists state in AsyncStorage
  - Automatically detects new users with welcome bonus

### Integration Points

#### Main Screen (Post-Signup)
- **Location**: `apps/mobile/app/main.tsx`
- **Behavior**: Shows animation immediately after signup completion
- **Flow**: Animation → Regular welcome content → Navigation options

#### Home Screen
- **Location**: `apps/mobile/app/(tabs)/home.tsx`
- **Behavior**: Shows animation in modal for new users landing on home
- **Flow**: Modal animation → Regular home content

### State Management

The animation state is managed through:
- **Local State**: Controls animation visibility and completion
- **AsyncStorage**: Persists whether user has seen the animation
- **User Context**: Determines eligibility based on coin balance

## Usage

### For New Users
1. User completes signup process
2. Animation automatically plays on main screen
3. After completion, shows regular welcome content
4. User can navigate to home or learn more

### For Existing Users
1. Animation only shows if they haven't seen it before
2. Triggers when user has 100+ coins (welcome bonus)
3. Shows once per user, then never again

### Manual Control
```typescript
import { WelcomeBonusAnimation } from '@/components/common';

<WelcomeBonusAnimation
  isVisible={shouldShow}
  onAnimationComplete={() => {
    // Handle completion
    setShowAnimation(false);
  }}
/>
```

## Technical Details

### Animation Libraries
- **React Native Animated**: Core animation system
- **Native Driver**: Uses native animation thread for performance
- **Spring Physics**: Natural-feeling animations with tension/friction

### Performance Optimizations
- **useNativeDriver**: Animations run on native thread
- **Efficient Interpolation**: Smooth value transitions
- **Memory Management**: Proper cleanup of animation references

### Accessibility
- **Visual Feedback**: Clear visual indicators
- **Haptic Support**: Ready for haptic feedback integration
- **Screen Reader**: Compatible with accessibility tools

## Customization

### Colors
The animation uses the app's theme colors:
- **Gold**: `colors.gold[500]`, `colors.gold[700]`
- **Primary**: `colors.primary[500]`, `colors.primary[600]`
- **Text**: `colors.text.primary`, `colors.text.gold`

### Timing
Animation durations can be adjusted:
- **Coin Counter**: 50ms intervals (configurable)
- **Bounce Effect**: 300ms per bounce
- **Text Glow**: 800ms pulse cycle
- **Confetti**: 1000ms flight duration

### Text Content
Graffiti text can be customized:
- **Main Text**: "🎉 WELCOME BONUS! 🎉"
- **Sub Text**: "100 COINS ADDED!"

## Future Enhancements

### Planned Features
- **Sound Effects**: Audio feedback during animation
- **Haptic Feedback**: Vibration patterns for mobile
- **Custom Themes**: Different animation styles
- **A/B Testing**: Multiple animation variants

### Potential Improvements
- **Lottie Integration**: More complex animations
- **Performance Metrics**: Animation frame rate monitoring
- **User Preferences**: Animation speed/style settings

## Testing

### Manual Testing
1. Complete new user signup flow
2. Verify animation plays correctly
3. Check completion callback triggers
4. Verify state persistence across app restarts

### Automated Testing
- **Component Tests**: Verify rendering and props
- **Hook Tests**: Test state management logic
- **Integration Tests**: End-to-end animation flow

## Troubleshooting

### Common Issues
- **Animation Not Playing**: Check `isVisible` prop and user eligibility
- **Performance Issues**: Ensure `useNativeDriver: true` is set
- **State Persistence**: Verify AsyncStorage permissions

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_ANIMATION = true;
```

## Dependencies

### Required Packages
- `react-native`: Core React Native functionality
- `@expo/vector-icons`: Icon components
- `@react-native-async-storage/async-storage`: State persistence

### Optional Enhancements
- `lottie-react-native`: For more complex animations
- `react-native-reanimated`: Advanced animation capabilities
- `expo-haptics`: Haptic feedback support

## Contributing

When modifying the animation:
1. Test on both iOS and Android
2. Verify performance on lower-end devices
3. Maintain accessibility standards
4. Update documentation for any API changes

## License

This feature is part of the Club Corra mobile app and follows the same licensing terms.

