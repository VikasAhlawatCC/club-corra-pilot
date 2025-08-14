import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from './services/otp.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { RateLimitService } from './services/rate-limit.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { OTP } from './entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OTP])],
  providers: [OtpService, EmailService, SmsService, RateLimitService, ErrorHandlerService],
  exports: [OtpService, EmailService, SmsService, RateLimitService, ErrorHandlerService],
})
export class CommonModule {}
