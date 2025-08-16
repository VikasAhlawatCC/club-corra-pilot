import { IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

export class SignupOtpVerificationDto {
  @IsString()
  @Matches(/^(\+91[0-9]{10}|[0-9]{10})$/, { message: 'Please provide a valid Indian mobile number (10 digits with or without +91 country code)' })
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
  user?: {
    id: string;
    mobileNumber: string;
    status: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}
