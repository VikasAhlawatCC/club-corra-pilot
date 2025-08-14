// Mock React Native modules for Jest tests
export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const ScrollView = 'ScrollView';
export const Alert = {
  alert: jest.fn(),
};
export const StyleSheet = {
  create: (styles: any) => styles,
};
export const Platform = {
  OS: 'ios',
  select: jest.fn((obj: any) => obj.ios || obj.default),
};
export const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
};
export const StatusBar = {
  setBarStyle: jest.fn(),
};
export const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};
export const Animated = {
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(),
  })),
};
export const Easing = {
  ease: jest.fn(),
};
export default {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  Animated,
  Easing,
};
