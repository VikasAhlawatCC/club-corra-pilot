import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateRedeemRequestDto {
  @IsString()
  brandId: string;

  @IsNumber()
  @Min(0.01, { message: 'Bill amount must be greater than 0' })
  @Max(100000, { message: 'Bill amount cannot exceed 100,000' })
  billAmount: number;

  @IsNumber()
  @Min(1, { message: 'Coins to redeem must be at least 1' })
  coinsToRedeem: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
