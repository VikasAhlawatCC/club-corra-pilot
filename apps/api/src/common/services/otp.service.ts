import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OTP, OTPType, OTPStatus } from '../entities/otp.entity';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { generateOTP } from '@shared/index';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
    private configService: ConfigService,
    private rateLimitService: RateLimitService,
  ) {}

  async generateOtp(identifier: string, type: OTPType): Promise<string> {
    // Check rate limit for OTP generation
    const canGenerate = await this.rateLimitService.checkRateLimit(
      `otp-generate:${identifier}_${type}`,
      'authenticated'
    );

    if (!canGenerate) {
      throw new BadRequestException('Too many OTP requests. Please wait before requesting another.');
    }

    // Generate OTP using shared function (6-digit by default)
    const otpCode = generateOTP();
    
    // TEMPORARY: Log OTP for testing (remove in production)
    console.log(`[DEBUG] Generated OTP for ${identifier}: ${otpCode}`);
    
    // Hash the OTP before storing
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    
    // Set expiration using shared constant
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

    // Invalidate any existing pending OTPs for this identifier
    await this.otpRepository.update(
      { identifier, type, status: OTPStatus.PENDING },
      { status: OTPStatus.EXPIRED }
    );

    // Create new OTP
    const otp = this.otpRepository.create({
      identifier,
      type,
      code: hashedOtp,
      expiresAt,
      status: OTPStatus.PENDING,
    });

    await this.otpRepository.save(otp);

    return otpCode;
  }

  async verifyOtp(identifier: string, type: OTPType, code: string): Promise<boolean> {
    // Check rate limit for OTP verification
    const canVerify = await this.rateLimitService.checkRateLimit(
      `otp-verify:${identifier}_${type}`,
      'authenticated'
    );

    if (!canVerify) {
      throw new BadRequestException('Too many verification attempts. Please wait before trying again.');
    }

    const otp = await this.otpRepository.findOne({
      where: {
        identifier,
        type,
        status: OTPStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP or OTP expired');
    }

    // Check if OTP has expired
    if (new Date() > otp.expiresAt) {
      await this.otpRepository.update(otp.id, { status: OTPStatus.EXPIRED });
      throw new BadRequestException('OTP has expired');
    }

    // Check attempts limit
    if (otp.attempts >= 3) {
      await this.otpRepository.update(otp.id, { status: OTPStatus.EXPIRED });
      throw new UnauthorizedException('Too many attempts. OTP expired');
    }

    // Verify OTP code
    const isValid = await bcrypt.compare(code, otp.code);
    
    if (!isValid) {
      // Increment attempts
      await this.otpRepository.update(otp.id, { attempts: otp.attempts + 1 });
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark OTP as verified and reset rate limit
    await this.otpRepository.update(otp.id, {
      status: OTPStatus.VERIFIED,
      verifiedAt: new Date(),
    });

    await this.rateLimitService.resetRateLimit(`otp-verify:${identifier}_${type}`);

    return true;
  }

  async isOtpValid(identifier: string, type: OTPType): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        identifier,
        type,
        status: OTPStatus.PENDING,
      },
    });

    if (!otp) return false;

    return new Date() <= otp.expiresAt && otp.attempts < 3;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.otpRepository.update(
      {
        status: OTPStatus.PENDING,
        expiresAt: new Date(),
      },
      { status: OTPStatus.EXPIRED }
    );
  }
}
