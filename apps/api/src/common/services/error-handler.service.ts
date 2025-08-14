import { Injectable, Logger, BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { AUTH_ERROR_MESSAGES } from '../constants/auth.constants';

/**
 * Standardized error handling service for authentication operations
 */
@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  /**
   * Handles authentication-related errors with consistent patterns
   * @param error - The original error
   * @param operation - The operation that failed
   * @param context - Additional context information
   * @returns A standardized error response
   */
  handleAuthError(error: any, operation: string, context?: any): never {
    this.logger.error(`Authentication error in ${operation}:`, { error: error.message, context });

    // Handle specific error types
    if (error instanceof BadRequestException) {
      throw error; // Re-throw validation errors as-is
    }

    if (error instanceof UnauthorizedException) {
      throw error; // Re-throw auth errors as-is
    }

    if (error instanceof ConflictException) {
      throw error; // Re-throw conflict errors as-is
    }

    if (error instanceof NotFoundException) {
      throw error; // Re-throw not found errors as-is
    }

    // Handle unknown errors with generic messages for security
    switch (operation) {
      case 'email_verification':
        throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL.VERIFICATION_FAILED);
      
      case 'password_setup':
        throw new BadRequestException('Failed to setup password');
      
      case 'password_reset':
        throw new BadRequestException('Failed to reset password');
      
      case 'user_creation':
        throw new BadRequestException('Failed to create user');
      
      default:
        throw new BadRequestException('Authentication operation failed');
    }
  }

  /**
   * Creates a standardized error response for mobile app compatibility
   * @param message - Error message
   * @param errorCode - Optional error code for mobile app handling
   * @param details - Optional additional error details
   * @returns Standardized error response
   */
  createErrorResponse(message: string, errorCode?: string, details?: any) {
    return {
      success: false,
      message,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Logs authentication attempts for security monitoring
   * @param operation - The authentication operation
   * @param userId - The user ID (if available)
   * @param success - Whether the operation was successful
   * @param metadata - Additional metadata
   */
  logAuthAttempt(operation: string, userId?: string, success: boolean = true, metadata?: any) {
    const logData = {
      operation,
      userId,
      success,
      timestamp: new Date().toISOString(),
      metadata,
    };

    if (success) {
      this.logger.log(`Authentication success: ${operation}`, logData);
    } else {
      this.logger.warn(`Authentication failure: ${operation}`, logData);
    }
  }
}
