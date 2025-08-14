// Comprehensive mock for expo-auth-session
const mockMakeRedirectUri = jest.fn(() => 'clubcorra://auth/callback');

const mockAuthRequest = jest.fn().mockImplementation(() => ({
  promptAsync: jest.fn().mockResolvedValue({
    type: 'success',
    params: { code: 'mock-auth-code' },
  }),
}));

export const useAuthRequest = () => [jest.fn(), {}, {}];
export const makeRedirectUri = mockMakeRedirectUri;
export const ResponseType = {
  Code: 'code',
  Token: 'token',
};
export class AuthRequest {
  constructor(config: any) {
    mockAuthRequest(config);
  }

  async promptAsync(options: any) {
    return {
      type: 'success',
      params: { code: 'mock-auth-code' },
    };
  }
}

// Export the mock functions for testing
export const mockFunctions = {
  makeRedirectUri: mockMakeRedirectUri,
  AuthRequest: mockAuthRequest,
};

export default {
  useAuthRequest,
  makeRedirectUri,
  ResponseType,
  AuthRequest,
  mockFunctions,
};
