import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class RejectTransactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
