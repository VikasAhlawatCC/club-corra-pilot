import { ErrorService, AppError } from '../error.service';

// Mock console methods
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleInfo = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.console = {
    ...console,
    error: mockConsoleError,
    warn: mockConsoleWarn,
    info: mockConsoleInfo,
  };
});

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = ErrorService.getInstance();
  });

  describe('parseApiError', () => {
    it('parses API error with response data message', () => {
      const apiError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('AUTH_FAILED');
      expect(result.message).toBe('Invalid credentials');
      expect(result.userMessage).toBe('Invalid credentials. Please check your details and try again.');
      expect(result.recoverable).toBe(true);
      expect(result.action).toBe('Check credentials');
    });

    it('parses API error with direct message', () => {
      const apiError = {
        message: 'OTP expired'
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('OTP_EXPIRED');
      expect(result.message).toBe('OTP expired');
      expect(result.userMessage).toBe('Verification code has expired. Please request a new one.');
      expect(result.recoverable).toBe(true);
      expect(result.action).toBe('Resend OTP');
    });

    it('handles unknown error', () => {
      const apiError = {};

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.userMessage).toBe('Something went wrong. Please try again.');
      expect(result.recoverable).toBe(true);
    });

    it('parses network error', () => {
      const apiError = {
        message: 'Network connection failed'
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.userMessage).toBe('Network connection issue. Please check your internet connection.');
      expect(result.action).toBe('Check connection');
    });

    it('parses server error', () => {
      const apiError = {
        message: 'Internal server error'
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.userMessage).toBe('Server is temporarily unavailable. Please try again later.');
      expect(result.action).toBe('Try again later');
    });

    it('parses validation error', () => {
      const apiError = {
        message: 'Invalid input data'
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.userMessage).toBe('Please check your input and try again.');
      expect(result.action).toBe('Fix input');
    });

    it('parses rate limit error', () => {
      const apiError = {
        message: 'Rate limit exceeded'
      };

      const result = errorService.parseApiError(apiError);
      expect(result.code).toBe('RATE_LIMITED');
      expect(result.userMessage).toBe('Too many attempts. Please wait a moment before trying again.');
      expect(result.action).toBe('Wait and retry');
    });
  });

  describe('getUserMessage', () => {
    it('returns user-friendly message from AppError', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Technical error message',
        userMessage: 'User-friendly message',
        recoverable: true,
      };

      const result = errorService.getUserMessage(appError);
      expect(result).toBe('User-friendly message');
    });
  });

  describe('isRecoverable', () => {
    it('returns recoverable status from AppError', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        userMessage: 'Test user message',
        recoverable: true,
      };

      const result = errorService.isRecoverable(appError);
      expect(result).toBe(true);
    });

    it('returns false for non-recoverable errors', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        userMessage: 'Test user message',
        recoverable: false,
      };

      const result = errorService.isRecoverable(appError);
      expect(result).toBe(false);
    });
  });

  describe('getSuggestedAction', () => {
    it('returns suggested action when available', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        userMessage: 'Test user message',
        recoverable: true,
        action: 'Try again',
      };

      const result = errorService.getSuggestedAction(appError);
      expect(result).toBe('Try again');
    });

    it('returns undefined when no action is suggested', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error',
        userMessage: 'Test user message',
        recoverable: true,
      };

      const result = errorService.getSuggestedAction(appError);
      expect(result).toBeUndefined();
    });
  });

  describe('logError', () => {
    it('logs error with context', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'Test user message',
        recoverable: true,
        action: 'Test action',
      };

      errorService.logError(appError, 'TestContext');
      expect(mockConsoleError).toHaveBeenCalledWith('[TestContext] Error:', {
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'Test user message',
        recoverable: true,
        action: 'Test action',
      });
    });

    it('logs error without context', () => {
      const appError: AppError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'Test user message',
        recoverable: true,
      };

      errorService.logError(appError);
      expect(mockConsoleError).toHaveBeenCalledWith('[App] Error:', {
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'Test user message',
        recoverable: true,
        action: undefined,
      });
    });
  });

  describe('handleCommonError', () => {
    it('parses and logs common error', () => {
      const apiError = {
        message: 'Invalid credentials'
      };

      const result = errorService.handleCommonError(apiError, 'AuthContext');
      expect(result.code).toBe('AUTH_FAILED');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
