import { IsString, IsNotEmpty, Matches, IsEmail } from 'class-validator';

export class SignupEmailVerificationDto {
  @IsString()
  @Matches(/^(\+91[0-9]{10}|[0-9]{10})$/, { message: 'Please provide a valid Indian mobile number (10 digits with or without +91 country code)' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class SignupEmailVerificationResponseDto {
  message: string;
  userId: string;
  accountActivated: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
