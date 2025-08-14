import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsMobilePhone, MinLength, MaxLength, IsIn, IsNotEmpty } from 'class-validator';
import { ProviderType } from '../../users/entities/auth-provider.entity';

export class SignupDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsEnum(ProviderType, { message: 'Please select a valid auth provider' })
  @IsOptional()
  authProvider?: ProviderType;

  @IsString()
  @IsOptional()
  oauthToken?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], { message: 'Please select a valid gender option' })
  @IsOptional()
  gender?: string;
}

export class OAuthSignupDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsEnum(ProviderType, { message: 'Please select a valid OAuth provider' })
  oauthProvider: ProviderType;

  @IsString()
  @MinLength(10)
  @IsNotEmpty({ message: 'OAuth token is required' })
  oauthToken: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], { message: 'Please select a valid gender option' })
  @IsOptional()
  gender?: string;
}

export class InitialSignupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;
}

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

export class SignupPasswordSetupDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}

export class SignupEmailVerificationDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
