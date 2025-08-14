import { IsString, MinLength, MaxLength, IsNotEmpty, IsMobilePhone } from 'class-validator';

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

export class InitialSignupResponseDto {
  message: string;
  mobileNumber: string;
  requiresOtpVerification: boolean;
  existingUserMessage?: string;
  redirectToLogin?: boolean;
}
