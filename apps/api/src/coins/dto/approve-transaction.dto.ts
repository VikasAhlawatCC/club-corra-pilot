import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
