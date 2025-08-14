import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class InitialSignupResponseDto {
  @IsString()
  message: string;

  @IsString()
  mobileNumber: string;

  @IsBoolean()
  requiresOtpVerification: boolean;

  @IsOptional()
  @IsString()
  existingUserMessage?: string;

  @IsOptional()
  @IsBoolean()
  redirectToLogin?: boolean;
}

export class SignupOtpVerificationResponseDto {
  @IsString()
  message: string;

  @IsString()
  userId: string;

  @IsBoolean()
  requiresPasswordSetup: boolean;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}

export class SignupPasswordSetupResponseDto {
  @IsString()
  message: string;

  @IsString()
  userId: string;

  @IsBoolean()
  requiresEmailVerification: boolean;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}

export class SignupEmailVerificationResponseDto {
  @IsString()
  message: string;

  @IsString()
  userId: string;

  @IsBoolean()
  accountActivated: boolean;

  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsNumber()
  expiresIn: number;
}

export class SignupResponseDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  requiresOtpVerification?: boolean;

  @IsOptional()
  @IsString()
  otpType?: string;

  @IsOptional()
  @IsString()
  existingUserMessage?: string;

  @IsOptional()
  @IsBoolean()
  redirectToLogin?: boolean;

  @IsOptional()
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class OtpResponseDto {
  message: string;
  expiresIn: number;
}

export class VerifyOtpResponseDto {
  message: string;
  isVerified: boolean;
  requiresProfileSetup?: boolean;
}

export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
