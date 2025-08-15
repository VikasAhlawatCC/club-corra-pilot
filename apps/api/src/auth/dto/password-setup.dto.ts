import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class PasswordSetupDto {
  @Matches(/^(\+91[0-9]{10}|[0-9]{10})$/, { message: 'Please provide a valid Indian mobile number (10 digits with or without +91 country code)' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobileNumber: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}
