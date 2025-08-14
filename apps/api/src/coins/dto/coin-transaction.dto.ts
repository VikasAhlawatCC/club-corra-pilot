import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';

export class CreateCoinTransactionDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT'])
  type: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  billAmount?: number;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
