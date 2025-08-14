import { IsString, MinLength, IsNotEmpty, IsMobilePhone } from 'class-validator';

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

export class SignupPasswordSetupResponseDto {
  message: string;
  userId: string;
  requiresEmailVerification: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}
