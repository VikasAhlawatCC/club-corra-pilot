import { IsString, IsNotEmpty, IsMobilePhone, IsEmail } from 'class-validator';

export class SignupEmailVerificationDto {
  @IsString()
  @IsMobilePhone('en-IN', {}, { message: 'Please provide a valid Indian mobile number' })
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
