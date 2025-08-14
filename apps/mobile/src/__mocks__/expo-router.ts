// Mock expo-router for Jest tests
export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
});

export const useLocalSearchParams = () => ({});
export const useGlobalSearchParams = () => ({});
export const useSegments = () => [];
export const usePathname = () => '/';
export const useRootNavigationState = () => ({});
export const useRootNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
});

export default {
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useSegments,
  usePathname,
  useRootNavigationState,
  useRootNavigation,
};
