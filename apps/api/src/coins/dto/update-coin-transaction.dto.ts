import { PartialType } from '@nestjs/mapped-types';
import { CreateCoinTransactionDto } from './create-coin-transaction.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCoinTransactionDto extends PartialType(CreateCoinTransactionDto) {
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
