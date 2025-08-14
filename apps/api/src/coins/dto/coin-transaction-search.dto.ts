import { IsOptional, IsEnum, IsUUID, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CoinTransactionSearchDto {
  @IsOptional()
  @IsEnum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT'])
  type?: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';

  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
