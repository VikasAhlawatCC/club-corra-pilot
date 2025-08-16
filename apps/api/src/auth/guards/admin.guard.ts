import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    console.log('🔐 AdminGuard - User object:', user);
    console.log('🔐 AdminGuard - User role:', user?.role);
    console.log('🔐 AdminGuard - User status:', user?.status);

    if (!user) {
      console.log('❌ AdminGuard - No user object found');
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has admin role
    if (!user.role || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      console.log('❌ AdminGuard - User does not have admin privileges. Role:', user.role);
      throw new UnauthorizedException('User does not have admin privileges');
    }

    console.log('✅ AdminGuard - User authenticated and authorized');
    return true;
  }
}
