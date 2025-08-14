// Mock expo-crypto for Jest tests
export const digestStringAsync = jest.fn();
export const randomUUID = jest.fn(() => 'mock-uuid-123');

export default {
  digestStringAsync,
  randomUUID,
};
