import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F0F23' },
        // Enhanced animation options
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Custom transition animations
        presentation: 'card',
        // Enhanced gesture handling
        // gestureResponseDistance: 50,
        // Smooth transitions
        // transitionSpec: {
        //   open: {
        //     animation: 'timing',
        //     config: {
        //       duration: 300,
        //       easing: 'easeInOut',
        //     },
        //   },
        //   close: {
        //     animation: 'timing',
        //     config: {
        //       duration: 300,
        //       easing: 'easeInOut',
        //     },
        //   },
        // },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          // Enhanced animation for main choice screen
          animation: 'fade',
          animationDuration: 400,
        }}
      />
      
      {/* Auth Flow Screens */}
      <Stack.Screen 
        name="register" 
        options={{
          // Registration screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="otp-verification" 
        options={{
          // OTP verification screen
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="password-setup" 
        options={{
          // Password setup screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="email-verification" 
        options={{
          // Email verification screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="profile-setup" 
        options={{
          // Profile setup screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          // Login screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="login-otp" 
        options={{
          // OTP login screen
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="google-auth" 
        options={{
          // OAuth screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
    </Stack>
  );
}
