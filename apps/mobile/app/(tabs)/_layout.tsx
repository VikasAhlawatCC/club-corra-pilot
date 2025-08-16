import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/styles/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <BlurView intensity={30} style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(15, 15, 35, 0.9)', 'rgba(30, 30, 63, 0.95)']}
              style={{ flex: 1 }}
            />
          </BlurView>
        ),
        tabBarActiveTintColor: colors.text.white,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          fontFamily: typography.fontFamily.medium,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.primary[500] : 'transparent',
                  borderWidth: focused ? 0 : 1,
                  borderColor: focused ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={24}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="suggest"
        options={{
          title: 'Suggest',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.primary[500] : 'transparent',
                  borderWidth: focused ? 0 : 1,
                  borderColor: focused ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons
                  name={focused ? 'bulb' : 'bulb-outline'}
                  size={24}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.primary[500] : 'transparent',
                  borderWidth: focused ? 0 : 1,
                  borderColor: focused ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons
                  name={focused ? 'list' : 'list-outline'}
                  size={24}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.primary[500] : 'transparent',
                  borderWidth: focused ? 0 : 1,
                  borderColor: focused ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={24}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
