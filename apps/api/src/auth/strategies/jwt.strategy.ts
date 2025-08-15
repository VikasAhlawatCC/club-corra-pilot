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
    // Check if this is an admin user
    if (payload.role && (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')) {
      const admin = await this.adminService.findById(payload.sub);
      
      if (!admin || admin.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid or inactive admin user');
      }

      return {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        firstName: admin.firstName,
        lastName: admin.lastName,
      };
    }

    // Regular user validation
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or inactive user');
    }

    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      email: user.email,
      status: user.status,
      roles: payload.roles || [],
    };
  }
}
