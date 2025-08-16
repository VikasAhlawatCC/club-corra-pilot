import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { AdminService } from '../../admin/admin.service';
import { UserStatus } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminService: AdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('🔐 JWT Strategy - Payload:', payload);
    
    // Check if this is an admin user
    if (payload.role && (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')) {
      console.log('🔐 JWT Strategy - Admin user detected, role:', payload.role);
      console.log('🔐 JWT Strategy - Looking for admin with ID:', payload.sub);
      
      const admin = await this.adminService.findById(payload.sub);
      console.log('🔐 JWT Strategy - Admin found:', admin);
      
      if (!admin || admin.status !== 'ACTIVE') {
        console.log('❌ JWT Strategy - Admin validation failed:', { admin, status: admin?.status });
        throw new UnauthorizedException('Invalid or inactive admin user');
      }

      const adminUser = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        firstName: admin.firstName,
        lastName: admin.lastName,
        // Add these fields to match what the admin guard expects
        sub: admin.id,
        roles: [admin.role],
      };
      
      console.log('✅ JWT Strategy - Admin user validated:', adminUser);
      return adminUser;
    }

    console.log('🔐 JWT Strategy - Regular user detected');
    // Regular user validation
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or inactive user');
    }

    return {
      id: user.id,
      sub: user.id, // Add this field for consistency with JWT payload
      mobileNumber: user.mobileNumber,
      email: user.email,
      status: user.status,
      roles: payload.roles || [],
    };
  }
}
