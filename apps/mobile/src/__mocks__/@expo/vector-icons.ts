import React from 'react';
import { Text } from 'react-native';

// Mock all icon components
export const Ionicons = ({ name, size, color, style, ...props }: any) => {
  return React.createElement(Text, { style: [{ fontSize: size, color }, style], ...props }, name);
};

// Add other icon sets as needed
export const AntDesign = Ionicons;
export const Entypo = Ionicons;
export const EvilIcons = Ionicons;
export const Feather = Ionicons;
export const FontAwesome = Ionicons;
export const FontAwesome5 = Ionicons;
export const Foundation = Ionicons;
export const MaterialIcons = Ionicons;
export const MaterialCommunityIcons = Ionicons;
export const SimpleLineIcons = Ionicons;
export const Octicons = Ionicons;
export const Zocial = Ionicons;
