import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';

export class SignupPasswordSetupDto {
  @IsString()
  @Matches(/^(\+91[0-9]{10}|[0-9]{10})$/, { message: 'Please provide a valid Indian mobile number (10 digits with or without +91 country code)' })
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
