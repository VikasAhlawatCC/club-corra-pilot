import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(private readonly rateLimitService: RateLimitService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Determine rate limit type based on controller and handler
    const rateLimitType = this.getRateLimitType(controller.name, handler.name);
    
    // Get identifier for rate limiting
    const identifier = this.getRateLimitIdentifier(request, rateLimitType);

    try {
      // Check rate limit
      await this.rateLimitService.checkRateLimit(identifier, rateLimitType);
      
      // Add rate limit headers to response
      this.addRateLimitHeaders(response, identifier, rateLimitType);
      
      return next.handle();
    } catch (error) {
      // Rate limit exceeded, error will be thrown
      throw error;
    }
  }

  private getRateLimitType(controllerName: string, handlerName: string): 'public' | 'authenticated' | 'admin' | 'file_upload' | 'websocket' {
    // Determine rate limit type based on controller and handler
    if (controllerName.includes('Auth') && (handlerName.includes('login') || handlerName.includes('signup'))) {
      return 'public';
    }
    
    if (controllerName.includes('File') && handlerName.includes('upload')) {
      return 'file_upload';
    }
    
    if (controllerName.includes('Admin') || handlerName.includes('admin')) {
      return 'admin';
    }
    
    if (controllerName.includes('Websocket')) {
      return 'websocket';
    }
    
    // Default to authenticated for most endpoints
    return 'authenticated';
  }

  private getRateLimitIdentifier(request: any, rateLimitType: string): string {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    
    switch (rateLimitType) {
      case 'public':
        return `public:${ip}`;
      case 'authenticated':
        const userId = request.user?.sub || 'anonymous';
        return `authenticated:${userId}`;
      case 'admin':
        const adminId = request.user?.sub || 'anonymous';
        return `admin:${adminId}`;
      case 'file_upload':
        const uploadUserId = request.user?.sub || 'anonymous';
        return `file_upload:${uploadUserId}`;
      case 'websocket':
        return `websocket:${ip}`;
      default:
        return `default:${ip}`;
    }
  }

  private addRateLimitHeaders(response: any, identifier: string, rateLimitType: string): void {
    // Add rate limit headers for information
    response.setHeader('X-RateLimit-Type', rateLimitType);
    response.setHeader('X-RateLimit-Identifier', identifier);
    
    // Note: We don't add remaining count headers as our current implementation
    // doesn't track remaining requests per window, but this could be enhanced
  }
}
