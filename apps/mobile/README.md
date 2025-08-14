# Club Corra Mobile App

A beautiful, elite React Native mobile application for Club Corra, featuring comprehensive user authentication and club management.

## 🚀 Features

### Authentication System
- **Mobile Number Signup**: SMS-based OTP verification
- **OAuth Integration**: Google and Facebook authentication (coming soon)
- **Profile Setup**: Collect user information with beautiful forms
- **Payment Setup**: Optional UPI ID collection
- **Secure Login**: OTP-based authentication for existing users

### User Interface
- **Modern Design**: Dark theme with gradient backgrounds and blur effects
- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Haptic Feedback**: Tactile responses for better user experience
- **Responsive Layout**: Optimized for all screen sizes
- **Beautiful Components**: Custom UI components with consistent styling

### Club Management
- **Home Dashboard**: Overview of user activity and featured content
- **Explore**: Discover new clubs and events
- **My Clubs**: Manage club memberships and invitations
- **Profile**: User settings and account management

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand with persistence
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form with Zod validation
- **Animations**: React Native Reanimated
- **Icons**: Expo Vector Icons
- **Haptics**: Expo Haptics
- **Blur Effects**: Expo Blur
- **Gradients**: Expo Linear Gradient

## 📱 Screens

### Authentication Flow
1. **Signup Screen** (`/auth/signup`)
   - Mobile number input with international support
   - OAuth options (Google, Facebook)
   - Beautiful toggle between SMS and OAuth

2. **OTP Verification** (`/auth/otp-verification`)
   - 6-digit OTP input with auto-focus
   - Countdown timer for resend
   - Beautiful animations and haptic feedback

3. **Profile Setup** (`/auth/profile-setup`)
   - First name, last name, date of birth, gender
   - Progress indicator
   - Form validation with Zod

4. **Payment Setup** (`/auth/payment-setup`)
   - Optional UPI ID collection
   - Benefits explanation
   - Skip option for later completion

5. **Login Screen** (`/auth/login`)
   - Mobile number + OTP authentication
   - Resend OTP functionality
   - Smooth transitions

### Main App
1. **Home Tab** (`/(tabs)/home`)
   - Welcome message with user's name
   - Quick stats and actions
   - Recent activity feed
   - Featured club

2. **Explore Tab** (`/(tabs)/explore`)
   - Search functionality
   - Category browsing
   - Trending clubs
   - Upcoming events

3. **Clubs Tab** (`/(tabs)/clubs`)
   - Active club memberships
   - Pending invitations
   - Club statistics
   - Recent activity

4. **Profile Tab** (`/(tabs)/profile`)
   - User profile information
   - Settings and preferences
   - Account actions
   - Logout functionality

## 🎨 Design System

### Colors
- **Primary**: Blue (#0ea5e9) - Main actions and highlights
- **Secondary**: Purple (#d946ef) - Secondary actions and accents
- **Success**: Green (#22c55e) - Positive states
- **Warning**: Yellow (#f59e0b) - Caution states
- **Error**: Red (#ef4444) - Error states
- **Dark**: Various shades of dark (#0F0F23 to #64748b)

### Typography
- **Display Font**: Poppins for headings
- **Body Font**: Inter for body text
- **Mono Font**: JetBrains Mono for technical content

### Components
- **Buttons**: Primary, Secondary with loading states
- **Inputs**: Phone input, OTP input, form inputs
- **Cards**: BlurView cards with gradient backgrounds
- **Headers**: Consistent authentication headers
- **Navigation**: Beautiful bottom tab bar with blur effects

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Yarn package manager
- Expo CLI
- iOS Simulator or Android Emulator

### Installation
1. Install dependencies:
   ```bash
   cd apps/mobile
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn start
   ```

3. Run on device/simulator:
   ```bash
   yarn ios     # iOS
   yarn android # Android
   ```

### Environment Setup
The app is configured to work with the shared packages from the monorepo. Ensure the following are set up:

- `packages/shared` - Contains types and schemas
- Metro bundler configuration for workspace packages
- Babel configuration for NativeWind

## 📱 App Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Main entry point
│   ├── auth/              # Authentication screens
│   │   ├── _layout.tsx    # Auth layout
│   │   ├── signup.tsx     # Signup screen
│   │   ├── otp-verification.tsx
│   │   ├── profile-setup.tsx
│   │   ├── payment-setup.tsx
│   │   └── login.tsx      # Login screen
│   └── (tabs)/            # Main app tabs
│       ├── _layout.tsx    # Tab layout
│       ├── home.tsx       # Home screen
│       ├── explore.tsx    # Explore screen
│       ├── clubs.tsx      # Clubs screen
│       └── profile.tsx    # Profile screen
├── src/
│   ├── components/        # Reusable components
│   │   ├── auth/          # Authentication components
│   │   └── ui/            # UI components
│   ├── hooks/             # Custom hooks
│   ├── providers/         # Context providers
│   └── stores/            # State management
├── assets/                # Images, fonts, animations
├── tailwind.config.js     # Tailwind configuration
├── metro.config.js        # Metro bundler config
└── babel.config.js        # Babel configuration
```

## 🎯 Key Features Implementation

### Authentication Flow
- **State Management**: Zustand store with AsyncStorage persistence
- **Form Validation**: Zod schemas for type-safe validation
- **OTP Handling**: Auto-focus, countdown timers, resend functionality
- **Navigation**: Smooth transitions between auth screens

### UI/UX Excellence
- **Haptic Feedback**: Tactile responses for all interactions
- **Smooth Animations**: Spring animations and transitions
- **Blur Effects**: Beautiful backdrop blur for depth
- **Gradient Backgrounds**: Rich, engaging visual design
- **Responsive Design**: Optimized for all screen sizes

### Performance
- **Metro Optimization**: Workspace package support
- **Lazy Loading**: Screen-based code splitting
- **Image Optimization**: Proper asset management
- **Memory Management**: Efficient component rendering

## 🚀 Future Enhancements

### Planned Features
- **OAuth Integration**: Google and Facebook authentication
- **Push Notifications**: Real-time updates
- **Offline Support**: Offline-first architecture
- **Deep Linking**: App-to-app navigation
- **Biometric Auth**: Fingerprint and Face ID support

### Technical Improvements
- **Performance Monitoring**: Sentry integration
- **Testing**: Jest and React Native Testing Library
- **E2E Testing**: Detox integration
- **CI/CD**: Automated testing and deployment

## 📄 License

This project is part of the Club Corra monorepo and follows the same licensing terms.

## 🤝 Contributing

1. Follow the monorepo structure and conventions
2. Ensure all authentication flows are properly tested
3. Maintain the elite UI/UX standards
4. Add proper TypeScript types and validation
5. Include haptic feedback for all interactions

## 📞 Support

For technical support or questions about the mobile app implementation, please refer to the main project documentation or contact the development team.
