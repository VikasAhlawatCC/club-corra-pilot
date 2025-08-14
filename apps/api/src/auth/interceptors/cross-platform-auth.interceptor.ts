import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface CrossPlatformResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  platform?: string;
  timestamp: string;
}

@Injectable()
export class CrossPlatformAuthInterceptor<T>
  implements NestInterceptor<T, CrossPlatformResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CrossPlatformResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Detect platform from headers or user agent
    const platform = this.detectPlatform(request);
    
    // Add platform header to response
    response.setHeader('X-Platform', platform);
    
    // Add CORS headers for cross-platform compatibility
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Platform');
    
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true,
        platform,
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private detectPlatform(request: Request): string {
    const userAgent = request.headers['user-agent'] || '';
    const platformHeader = request.headers['x-platform'] as string;
    
    if (platformHeader) {
      return platformHeader;
    }
    
    // Detect platform from user agent
    if (userAgent.includes('Expo') || userAgent.includes('ReactNative')) {
      return 'mobile';
    }
    
    if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
      return 'web';
    }
    
    // Default to API
    return 'api';
  }
}

@Injectable()
export class MobileAuthInterceptor<T>
  implements NestInterceptor<T, CrossPlatformResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CrossPlatformResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Force platform to mobile
    const platform = 'mobile';
    
    // Add mobile-specific headers
    response.setHeader('X-Platform', platform);
    response.setHeader('X-Client-Type', 'mobile');
    
    // Add mobile-specific CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Platform, X-Client-Type');
    
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true,
        platform,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

@Injectable()
export class WebAuthInterceptor<T>
  implements NestInterceptor<T, CrossPlatformResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CrossPlatformResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Force platform to web
    const platform = 'web';
    
    // Add web-specific headers
    response.setHeader('X-Platform', platform);
    response.setHeader('X-Client-Type', 'web');
    
    // Add web-specific CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Platform, X-Client-Type');
    
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true,
        platform,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
