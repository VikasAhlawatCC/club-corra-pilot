// Mock expo-haptics for Jest tests
export const impactAsync = jest.fn();
export const notificationAsync = jest.fn();
export const selectionAsync = jest.fn();

export default {
  impactAsync,
  notificationAsync,
  selectionAsync,
};
