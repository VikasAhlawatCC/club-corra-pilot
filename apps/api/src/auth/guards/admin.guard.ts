import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has admin role
    if (!user.role || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new UnauthorizedException('User does not have admin privileges');
    }

    return true;
  }
}
