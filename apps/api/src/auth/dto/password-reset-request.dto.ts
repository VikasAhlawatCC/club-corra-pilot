import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordResetRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required for password reset' })
  email: string;
}
