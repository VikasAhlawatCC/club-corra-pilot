import { IsString, IsEmail, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ProviderType } from '../../users/entities/auth-provider.entity';

export class MobileLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  otpCode: string;
}

export class MobilePasswordLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class EmailLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class OAuthLoginDto {
  @IsEnum(ProviderType, { message: 'Please select a valid OAuth provider' })
  provider: ProviderType;

  @IsString()
  @IsNotEmpty({ message: 'OAuth access token is required' })
  accessToken: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
