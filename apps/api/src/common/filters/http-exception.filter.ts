import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    // Log the error with context
    this.logger.error(
      `HTTP Exception: ${status} - ${JSON.stringify(message)}`,
      {
        path: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        timestamp: new Date().toISOString(),
      },
    );

    // Determine if this is a validation error
    let errorResponse: any;
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message['message'])) {
      // Validation error
      errorResponse = {
        statusCode: status,
        message: 'Validation failed',
        errors: message['message'],
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    } else {
      // Other HTTP errors
      errorResponse = {
        statusCode: status,
        message: typeof message === 'string' ? message : message['message'] || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    response.status(status).json(errorResponse);
  }
}
