import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { OTPType } from '../../common/entities/otp.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {
    super({
      usernameField: 'mobileNumber',
      passwordField: 'otpCode',
    });
  }

  async validate(mobileNumber: string, otpCode: string): Promise<any> {
    // Verify OTP first
    const otpResult = await this.authService.verifyOtp({
      mobileNumber,
      code: otpCode,
      type: OTPType.SMS
    });
    
    if (!otpResult) {
      throw new UnauthorizedException('Invalid mobile number or OTP');
    }

    // Find user by mobile number
    const user = await this.usersService.findByMobileNumber(mobileNumber);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
