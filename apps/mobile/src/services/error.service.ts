export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  action?: string;
}

export class ErrorService {
  private static instance: ErrorService;
  
  private constructor() {}
  
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // Parse API errors and convert them to user-friendly messages
  parseApiError(error: any): AppError {
    if (error.response?.data?.message) {
      return this.mapApiErrorToAppError(error.response.data.message);
    }
    
    if (error.message) {
      return this.mapApiErrorToAppError(error.message);
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      recoverable: true,
    };
  }

  // Map common API error messages to user-friendly messages
  private mapApiErrorToAppError(apiMessage: string): AppError {
    const lowerMessage = apiMessage.toLowerCase();
    
    // Authentication errors
    if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('authentication failed')) {
      return {
        code: 'AUTH_FAILED',
        message: apiMessage,
        userMessage: 'Invalid credentials. Please check your details and try again.',
        recoverable: true,
        action: 'Check credentials',
      };
    }
    
    if (lowerMessage.includes('otp expired') || lowerMessage.includes('verification expired')) {
      return {
        code: 'OTP_EXPIRED',
        message: apiMessage,
        userMessage: 'Verification code has expired. Please request a new one.',
        recoverable: true,
        action: 'Resend OTP',
      };
    }
    
    if (lowerMessage.includes('invalid otp') || lowerMessage.includes('wrong code')) {
      return {
        code: 'INVALID_OTP',
        message: apiMessage,
        userMessage: 'Invalid verification code. Please check and try again.',
        recoverable: true,
        action: 'Try again',
      };
    }
    
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many attempts')) {
      return {
        code: 'RATE_LIMITED',
        message: apiMessage,
        userMessage: 'Too many attempts. Please wait a moment before trying again.',
        recoverable: true,
        action: 'Wait and retry',
      };
    }
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: apiMessage,
        userMessage: 'Network connection issue. Please check your internet connection.',
        recoverable: true,
        action: 'Check connection',
      };
    }
    
    if (lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
      return {
        code: 'SERVER_ERROR',
        message: apiMessage,
        userMessage: 'Server is temporarily unavailable. Please try again later.',
        recoverable: true,
        action: 'Try again later',
      };
    }
    
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return {
        code: 'VALIDATION_ERROR',
        message: apiMessage,
        userMessage: 'Please check your input and try again.',
        recoverable: true,
        action: 'Fix input',
      };
    }
    
    // Default case
    return {
      code: 'API_ERROR',
      message: apiMessage,
      userMessage: 'Something went wrong. Please try again.',
      recoverable: true,
    };
  }

  // Get user-friendly error message
  getUserMessage(error: AppError): string {
    return error.userMessage;
  }

  // Check if error is recoverable
  isRecoverable(error: AppError): boolean {
    return error.recoverable;
  }

  // Get suggested action for the error
  getSuggestedAction(error: AppError): string | undefined {
    return error.action;
  }

  // Log error for debugging
  logError(error: AppError, context?: string): void {
    console.error(`[${context || 'App'}] Error:`, {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      recoverable: error.recoverable,
      action: error.action,
    });
  }

  // Handle common error scenarios
  handleCommonError(error: any, context?: string): AppError {
    const appError = this.parseApiError(error);
    this.logError(appError, context);
    return appError;
  }
}

export const errorService = ErrorService.getInstance();
