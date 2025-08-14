import { IsString, MinLength, MaxLength, IsNotEmpty, IsMobilePhone } from 'class-validator';

export class SignupOtpVerificationDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @IsNotEmpty({ message: 'OTP code is required' })
  otpCode: string;
}

export class SignupOtpVerificationResponseDto {
  message: string;
  userId: string;
  requiresPasswordSetup: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}
