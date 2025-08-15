import { IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

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
  @Matches(/^(\+91[0-9]{10}|[0-9]{10})$/, { message: 'Please provide a valid Indian mobile number (10 digits with or without +91 country code)' })
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
