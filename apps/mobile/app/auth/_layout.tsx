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
      
      {/* New Auth Flow Screens */}
      <Stack.Screen 
        name="new-signup" 
        options={{
          // Initial signup screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="new-otp-verification" 
        options={{
          // OTP verification screen
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="new-password-setup" 
        options={{
          // Password setup screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="new-email-verification" 
        options={{
          // Email verification screen
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      
      {/* Legacy Screens (maintained for backward compatibility) */}
      <Stack.Screen 
        name="register" 
        options={{
          // Smooth slide animation for registration flow
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="otp-verification" 
        options={{
          // Quick slide animation for OTP screen
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="email-verification" 
        options={{
          // Smooth transition for email verification
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="profile-setup" 
        options={{
          // Elegant slide animation for profile setup
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="password-setup" 
        options={{
          // Final step with enhanced animation
          animation: 'slide_from_right',
          animationDuration: 400,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          // Smooth login animation
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
      <Stack.Screen 
        name="login-otp" 
        options={{
          // Quick OTP login animation
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen 
        name="google-auth" 
        options={{
          // OAuth animation
          animation: 'slide_from_right',
          animationDuration: 350,
        }}
      />
    </Stack>
  );
}
