import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { OTPType } from '../../common/entities/otp.entity';

export class RequestOtpDto {
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsEnum(OTPType, { message: 'Please select a valid OTP type' })
  type: OTPType;
}

export class VerifyOtpDto {
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  code: string;

  @IsEnum(OTPType, { message: 'Please select a valid OTP type' })
  type: OTPType;
}

export class ResendOtpDto {
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsEnum(OTPType, { message: 'Please select a valid OTP type' })
  type: OTPType;
}
