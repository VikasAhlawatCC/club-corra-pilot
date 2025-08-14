import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  transactionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
