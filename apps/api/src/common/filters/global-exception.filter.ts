import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError, TypeORMError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
        details = (exceptionResponse as any).details || null;
      } else {
        message = exceptionResponse as string;
        errorCode = 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      errorCode = 'DATABASE_ERROR';
      
      // Handle specific database errors
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource not found';
        errorCode = 'FOREIGN_KEY_VIOLATION';
      }
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database error occurred';
      errorCode = 'DATABASE_ERROR';
    } else if (exception instanceof Error) {
      // Handle business logic errors
      if (exception.message.includes('insufficient')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        errorCode = 'INSUFFICIENT_BALANCE';
      } else if (exception.message.includes('pending')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        errorCode = 'PENDING_REQUESTS_EXIST';
      } else if (exception.message.includes('cap')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        errorCode = 'BRAND_CAP_EXCEEDED';
      } else if (exception.message.includes('validation')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        errorCode = 'VALIDATION_ERROR';
      } else if (exception.message.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
        message = exception.message;
        errorCode = 'RESOURCE_NOT_FOUND';
      } else if (exception.message.includes('already exists')) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
        errorCode = 'RESOURCE_EXISTS';
      } else if (exception.message.includes('access denied')) {
        status = HttpStatus.FORBIDDEN;
        message = exception.message;
        errorCode = 'ACCESS_DENIED';
      }
    }

    // Log the error
    this.logger.error(
      `Exception occurred: ${errorCode} - ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
      {
        path: request.url,
        method: request.method,
        userId: (request as any).user?.sub,
        timestamp: new Date().toISOString(),
      },
    );

    // Create error response
    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Send response
    response.status(status).json(errorResponse);
  }
}
